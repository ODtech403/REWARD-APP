import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// Minimum deposit amount in Naira (or your currency)
const MIN_DEPOSIT = 1000 // 1000 Naira minimum

interface CreatePaymentRequest {
  amount: number // Amount in Naira
  email?: string
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
        { error: { code: 'FORBIDDEN', message: 'Only advertisers can add funds' } },
        { status: 403 }
      )
    }

    // Parse request body
    const body: CreatePaymentRequest = await request.json()
    const { amount } = body

    // Validate amount
    if (typeof amount !== 'number' || amount < MIN_DEPOSIT) {
      return NextResponse.json(
        { error: { code: 'INVALID_AMOUNT', message: `Minimum deposit is ₦${MIN_DEPOSIT}` } },
        { status: 400 }
      )
    }

    // Convert to kobo for Paystack (1 Naira = 100 kobo)
    const amountInKobo = Math.round(amount * 100)

    // Generate unique reference
    const reference = `dep_${user.id.substring(0, 8)}_${Date.now()}`

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile.email,
        amount: amountInKobo,
        reference,
        callback_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/advertiser-wallet?payment=callback`,
        metadata: {
          advertiser_id: user.id,
          advertiser_email: profile.email,
          deposit_amount: amount.toString(),
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error('Paystack initialization error:', paystackData)
      return NextResponse.json(
        { error: { code: 'PAYSTACK_ERROR', message: paystackData.message || 'Failed to initialize payment' } },
        { status: 400 }
      )
    }

    // Create a pending deposit record in the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: depositError } = await (supabase as any)
      .from('deposits')
      .insert({
        advertiser_id: user.id,
        amount: amount,
        stripe_payment_intent_id: reference, // Reusing this field for Paystack reference
        status: 'pending',
      })

    if (depositError) {
      console.error('Deposit record creation error:', depositError)
      // Don't fail the request - the webhook will handle the deposit
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
      amount: amount,
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
