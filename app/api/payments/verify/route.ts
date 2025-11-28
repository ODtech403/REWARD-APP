import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type DepositRow = Database['public']['Tables']['deposits']['Row']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: { code: 'MISSING_REFERENCE', message: 'Payment reference is required' } },
        { status: 400 }
      )
    }

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

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json(
        { error: { code: 'PAYMENT_FAILED', message: 'Payment verification failed' } },
        { status: 400 }
      )
    }

    // Check if this payment was already processed
    const { data: existingDeposit } = await supabase
      .from('deposits')
      .select('status')
      .eq('stripe_payment_intent_id', reference)
      .single<Pick<DepositRow, 'status'>>()

    if (existingDeposit?.status === 'completed') {
      // Already processed, just return success
      return NextResponse.json({
        success: true,
        amount: paystackData.data.amount / 100,
        alreadyProcessed: true,
      })
    }

    // Get deposit amount from Paystack response (convert from kobo to Naira)
    const depositAmount = paystackData.data.amount / 100

    // Fetch current user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' } },
        { status: 404 }
      )
    }

    const profile = profileData
    const newBalance = profile.wallet_balance + depositAmount

    // Update wallet balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        wallet_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Balance update error:', updateError)
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: 'Failed to update wallet balance' } },
        { status: 500 }
      )
    }

    // Update deposit record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('deposits')
      .update({ status: 'completed' })
      .eq('stripe_payment_intent_id', reference)

    // Log transaction
    const transactionInsert: TransactionInsert = {
      user_id: user.id,
      transaction_type: 'deposit',
      amount: depositAmount,
      balance_after: newBalance,
      description: 'Deposit via Paystack',
      metadata: {
        paystack_reference: reference,
        payment_method: 'paystack',
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('transactions').insert(transactionInsert)

    return NextResponse.json({
      success: true,
      amount: depositAmount,
      newBalance,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
