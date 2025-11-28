import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

const REFERRAL_REWARD = 0.02

// GET - Get user's referral info
export async function GET() {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Get user's referral info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code, referral_count, referral_earnings')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      )
    }

    // Get list of referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select(`
        id,
        reward_amount,
        status,
        created_at,
        referred:referred_id(display_name, email)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      referralCode: profile.referral_code,
      referralCount: profile.referral_count,
      referralEarnings: profile.referral_earnings,
      rewardPerReferral: REFERRAL_REWARD,
      referrals: referrals || [],
    })
  } catch (error) {
    console.error('Referral info error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

// POST - Apply referral code (called during registration)
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { referralCode } = body

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_CODE', message: 'Referral code is required' } },
        { status: 400 }
      )
    }

    // Call the process_referral function
    const { data, error } = await supabase.rpc('process_referral', {
      p_new_user_id: user.id,
      p_referral_code: referralCode.toUpperCase().trim(),
    })

    if (error) {
      console.error('Process referral error:', error)
      return NextResponse.json(
        { error: { code: 'REFERRAL_FAILED', message: error.message } },
        { status: 400 }
      )
    }

    const result = data as { success: boolean; error?: string; referrer_id?: string; reward_amount?: number }

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'REFERRAL_FAILED', message: result.error || 'Failed to process referral' } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Referral applied successfully',
      rewardAmount: result.reward_amount,
    })
  } catch (error) {
    console.error('Apply referral error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
