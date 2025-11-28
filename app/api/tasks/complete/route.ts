import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database, CompleteTaskResult } from '@/lib/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

// Minimum time required to complete a task (in seconds)
const MIN_TIME_REQUIRED = 5

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Validate user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { taskId, timeSpent } = body

    if (!taskId) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Task ID is required' } },
        { status: 400 }
      )
    }

    // Validate minimum time spent
    if (typeof timeSpent !== 'number' || timeSpent < MIN_TIME_REQUIRED) {
      return NextResponse.json(
        { error: { code: 'INSUFFICIENT_TIME', message: `Minimum ${MIN_TIME_REQUIRED} seconds required` } },
        { status: 400 }
      )
    }


    // Fetch the campaign/task
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', taskId)
      .single()

    if (campaignError || !campaignData) {
      return NextResponse.json(
        { error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      )
    }

    const campaign = campaignData as Campaign

    // Check if task is active
    if (campaign.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'TASK_UNAVAILABLE', message: 'Task is not available' } },
        { status: 400 }
      )
    }

    // Check if campaign has sufficient budget
    const remainingBudget = campaign.total_budget - campaign.spent_amount
    if (remainingBudget < campaign.cost_per_action) {
      return NextResponse.json(
        { error: { code: 'BUDGET_DEPLETED', message: 'Task budget is depleted' } },
        { status: 400 }
      )
    }

    // Check cooldown status - prevent duplicate completion
    const { data: existingCompletion } = await supabase
      .from('task_completions')
      .select('id, cooldown_ends_at')
      .eq('user_id', user.id)
      .eq('campaign_id', taskId)
      .gt('cooldown_ends_at', new Date().toISOString())
      .limit(1)
      .single()

    if (existingCompletion) {
      return NextResponse.json(
        { error: { code: 'COOLDOWN_ACTIVE', message: 'Task is on cooldown' } },
        { status: 400 }
      )
    }

    // Get client IP and device info for fraud prevention
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const deviceFingerprint = `${userAgent}-${ipAddress}`.substring(0, 255)


    // Call the Supabase RPC function for atomic task completion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('complete_task', {
      p_user_id: user.id,
      p_campaign_id: taskId,
      p_ip_address: ipAddress,
      p_device_fingerprint: deviceFingerprint,
    })

    if (rpcError) {
      console.error('Task completion RPC error:', rpcError)
      return NextResponse.json(
        { error: { code: 'COMPLETION_FAILED', message: rpcError.message || 'Failed to complete task' } },
        { status: 500 }
      )
    }

    const result = rpcData as CompleteTaskResult

    // The RPC returns: { success, new_balance, cooldown_ends_at, reward_amount, error_message }
    if (!result || !result.success) {
      return NextResponse.json(
        { error: { code: 'COMPLETION_FAILED', message: result?.error_message || 'Failed to complete task' } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      newBalance: result.new_balance,
      cooldownEndsAt: result.cooldown_ends_at,
      rewardAmount: result.reward_amount,
    })
  } catch (error) {
    console.error('Task completion error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
