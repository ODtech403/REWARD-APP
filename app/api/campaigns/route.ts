import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Campaign = Database['public']['Tables']['campaigns']['Row']
type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

// Minimum budget required for campaign creation
const MIN_BUDGET = 10

interface CampaignCreateRequest {
  title: string
  description?: string
  categoryId?: string
  campaignType: 'survey' | 'video' | 'task' | 'app_download' | 'website_visit'
  totalBudget: number
  costPerAction: number
  cooldownSeconds?: number
  estimatedDurationMinutes?: number
  maxCompletionsPerUser?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  thumbnailUrl?: string
  gradientStart?: string
  gradientEnd?: string
  expiresAt?: string
}

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


    // Fetch advertiser profile to verify role and balance
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' } },
        { status: 404 }
      )
    }

    const profile = profileData as Profile

    // Verify user is an advertiser
    if (profile.role !== 'advertiser' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only advertisers can create campaigns' } },
        { status: 403 }
      )
    }

    // Parse request body
    const body: CampaignCreateRequest = await request.json()
    const {
      title,
      description,
      categoryId,
      campaignType,
      totalBudget,
      costPerAction,
      cooldownSeconds = 120, // Default 2 minutes cooldown
      estimatedDurationMinutes = 5,
      maxCompletionsPerUser = 1, // Default: user can complete once
      difficulty = 'easy',
      thumbnailUrl,
      gradientStart = '#8B7ECC',
      gradientEnd = '#A99DD8',
      expiresAt,
    } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Title is required' } },
        { status: 400 }
      )
    }

    if (!campaignType) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Campaign type is required' } },
        { status: 400 }
      )
    }

    // Validate budget
    if (typeof totalBudget !== 'number' || totalBudget < MIN_BUDGET) {
      return NextResponse.json(
        { error: { code: 'INVALID_BUDGET', message: `Minimum budget is $${MIN_BUDGET}` } },
        { status: 400 }
      )
    }

    // Validate cost per action
    if (typeof costPerAction !== 'number' || costPerAction <= 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_CPA', message: 'Cost per action must be greater than 0' } },
        { status: 400 }
      )
    }

    // Validate CPA doesn't exceed budget
    if (costPerAction > totalBudget) {
      return NextResponse.json(
        { error: { code: 'INVALID_CPA', message: 'Cost per action cannot exceed total budget' } },
        { status: 400 }
      )
    }

    // Validate advertiser has sufficient wallet balance
    if (profile.wallet_balance < totalBudget) {
      return NextResponse.json(
        { error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient wallet balance' } },
        { status: 400 }
      )
    }


    // Calculate new balance after deduction
    const newBalance = profile.wallet_balance - totalBudget

    // Create campaign record with status='active'
    const campaignInsert: CampaignInsert = {
      advertiser_id: user.id,
      category_id: categoryId || null,
      title: title.trim(),
      description: description?.trim() || null,
      thumbnail_url: thumbnailUrl || null,
      campaign_type: campaignType,
      total_budget: totalBudget,
      spent_amount: 0,
      cost_per_action: costPerAction,
      cooldown_seconds: cooldownSeconds,
      estimated_duration_minutes: estimatedDurationMinutes,
      difficulty,
      status: 'active',
      gradient_start: gradientStart,
      gradient_end: gradientEnd,
      expires_at: expiresAt || null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaignData, error: campaignError } = await (supabase as any)
      .from('campaigns')
      .insert(campaignInsert)
      .select()
      .single()

    if (campaignError || !campaignData) {
      console.error('Campaign creation error:', campaignError)
      return NextResponse.json(
        { error: { code: 'CREATION_FAILED', message: 'Failed to create campaign' } },
        { status: 500 }
      )
    }

    const campaign = campaignData as Campaign

    // Deduct budget from advertiser wallet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: balanceError } = await (supabase as any)
      .from('profiles')
      .update({ 
        wallet_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (balanceError) {
      // Rollback: delete the campaign if balance update fails
      await supabase.from('campaigns').delete().eq('id', campaign.id)
      console.error('Balance update error:', balanceError)
      return NextResponse.json(
        { error: { code: 'BALANCE_UPDATE_FAILED', message: 'Failed to update wallet balance' } },
        { status: 500 }
      )
    }

    // Log transaction
    const transactionInsert: TransactionInsert = {
      user_id: user.id,
      campaign_id: campaign.id,
      transaction_type: 'campaign_spend',
      amount: -totalBudget,
      balance_after: newBalance,
      description: `Campaign created: ${title.trim()}`,
      metadata: {
        campaign_type: campaignType,
        cost_per_action: costPerAction,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: transactionError } = await (supabase as any)
      .from('transactions')
      .insert(transactionInsert)

    if (transactionError) {
      // Log error but don't fail the request - campaign is already created
      console.error('Transaction logging error:', transactionError)
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        totalBudget: campaign.total_budget,
        costPerAction: campaign.cost_per_action,
        estimatedCompletions: Math.floor(totalBudget / costPerAction),
      },
      newBalance,
    })
  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}


interface CampaignUpdateRequest {
  campaignId: string
  action: 'toggle_status' | 'add_funds'
  status?: 'active' | 'paused'
  amount?: number
}

export async function PATCH(request: NextRequest) {
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

    // Fetch advertiser profile to verify role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' } },
        { status: 404 }
      )
    }

    const profile = profileData as Profile

    // Verify user is an advertiser
    if (profile.role !== 'advertiser' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only advertisers can manage campaigns' } },
        { status: 403 }
      )
    }

    // Parse request body
    const body: CampaignUpdateRequest = await request.json()
    const { campaignId, action, status, amount } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Campaign ID is required' } },
        { status: 400 }
      )
    }

    // Fetch the campaign to verify ownership
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('advertiser_id', user.id)
      .single()

    if (campaignError || !campaignData) {
      return NextResponse.json(
        { error: { code: 'CAMPAIGN_NOT_FOUND', message: 'Campaign not found or access denied' } },
        { status: 404 }
      )
    }

    const campaign = campaignData as Campaign

    // Handle toggle_status action (pause/resume)
    if (action === 'toggle_status') {
      if (!status || (status !== 'active' && status !== 'paused')) {
        return NextResponse.json(
          { error: { code: 'INVALID_STATUS', message: 'Status must be active or paused' } },
          { status: 400 }
        )
      }

      // Cannot resume a depleted campaign without adding funds
      if (status === 'active' && campaign.status === 'depleted') {
        return NextResponse.json(
          { error: { code: 'CAMPAIGN_DEPLETED', message: 'Cannot resume depleted campaign. Add funds first.' } },
          { status: 400 }
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('campaigns')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (updateError) {
        console.error('Campaign status update error:', updateError)
        return NextResponse.json(
          { error: { code: 'UPDATE_FAILED', message: 'Failed to update campaign status' } },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaignId,
          status,
        },
      })
    }

    // Handle add_funds action
    if (action === 'add_funds') {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json(
          { error: { code: 'INVALID_AMOUNT', message: 'Amount must be greater than 0' } },
          { status: 400 }
        )
      }

      // Verify advertiser has sufficient wallet balance
      if (profile.wallet_balance < amount) {
        return NextResponse.json(
          { error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient wallet balance' } },
          { status: 400 }
        )
      }

      const newCampaignBudget = campaign.total_budget + amount
      const newWalletBalance = profile.wallet_balance - amount
      const remainingBudget = newCampaignBudget - campaign.spent_amount

      // Determine new status - reactivate if was depleted and now has sufficient funds
      let newStatus = campaign.status
      if (campaign.status === 'depleted' && remainingBudget >= campaign.cost_per_action) {
        newStatus = 'active'
      }

      // Update campaign budget
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: campaignUpdateError } = await (supabase as any)
        .from('campaigns')
        .update({ 
          total_budget: newCampaignBudget,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (campaignUpdateError) {
        console.error('Campaign budget update error:', campaignUpdateError)
        return NextResponse.json(
          { error: { code: 'UPDATE_FAILED', message: 'Failed to update campaign budget' } },
          { status: 500 }
        )
      }

      // Deduct from advertiser wallet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: balanceError } = await (supabase as any)
        .from('profiles')
        .update({ 
          wallet_balance: newWalletBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (balanceError) {
        // Rollback campaign budget update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('campaigns')
          .update({ 
            total_budget: campaign.total_budget,
            status: campaign.status,
          })
          .eq('id', campaignId)
        
        console.error('Balance update error:', balanceError)
        return NextResponse.json(
          { error: { code: 'BALANCE_UPDATE_FAILED', message: 'Failed to update wallet balance' } },
          { status: 500 }
        )
      }

      // Log transaction
      const transactionInsert: TransactionInsert = {
        user_id: user.id,
        campaign_id: campaignId,
        transaction_type: 'campaign_spend',
        amount: -amount,
        balance_after: newWalletBalance,
        description: `Added funds to campaign: ${campaign.title}`,
        metadata: {
          previous_budget: campaign.total_budget,
          new_budget: newCampaignBudget,
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('transactions').insert(transactionInsert)

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaignId,
          totalBudget: newCampaignBudget,
          status: newStatus,
        },
        newWalletBalance,
      })
    }

    return NextResponse.json(
      { error: { code: 'INVALID_ACTION', message: 'Invalid action specified' } },
      { status: 400 }
    )
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
