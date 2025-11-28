import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import type { Database } from '@/lib/types/database'

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type Profile = Database['public']['Tables']['profiles']['Row']

// Create a Supabase client with service role key for webhook operations
// This bypasses RLS since webhooks don't have user context
function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Verify Paystack webhook signature
function verifyPaystackSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')
  return hash === signature
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  if (!signature) {
    return NextResponse.json(
      { error: { code: 'MISSING_SIGNATURE', message: 'Missing Paystack signature' } },
      { status: 400 }
    )
  }

  // Verify the webhook signature
  if (!verifyPaystackSignature(body, signature)) {
    console.error('Webhook signature verification failed')
    return NextResponse.json(
      { error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } },
      { status: 400 }
    )
  }

  let event: { event: string; data: Record<string, unknown> }

  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_PAYLOAD', message: 'Invalid JSON payload' } },
      { status: 400 }
    )
  }

  // Handle the event
  if (event.event === 'charge.success') {
    try {
      await handlePaymentSuccess(event.data)
    } catch (error) {
      console.error('Error handling payment success:', error)
      return NextResponse.json(
        { error: { code: 'PROCESSING_ERROR', message: 'Failed to process payment' } },
        { status: 500 }
      )
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true })
}

interface PaystackChargeData {
  reference: string
  amount: number // in kobo
  metadata?: {
    advertiser_id?: string
    deposit_amount?: string
  }
}

async function handlePaymentSuccess(data: Record<string, unknown>) {
  const supabase = createServiceClient()
  
  const chargeData = data as unknown as PaystackChargeData
  const advertiserId = chargeData.metadata?.advertiser_id
  const depositAmount = chargeData.metadata?.deposit_amount 
    ? parseFloat(chargeData.metadata.deposit_amount)
    : chargeData.amount / 100 // Convert from kobo to Naira

  if (!advertiserId || isNaN(depositAmount)) {
    throw new Error('Invalid payment metadata')
  }

  // Fetch current advertiser profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', advertiserId)
    .single()

  if (profileError || !profileData) {
    throw new Error(`Advertiser profile not found: ${advertiserId}`)
  }

  const profile = profileData as Profile
  const currentBalance = profile.wallet_balance
  const newBalance = currentBalance + depositAmount

  // Update advertiser wallet balance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({
      wallet_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', advertiserId)

  if (updateError) {
    throw new Error(`Failed to update wallet balance: ${updateError.message}`)
  }

  // Update deposit record status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: depositUpdateError } = await (supabase as any)
    .from('deposits')
    .update({ status: 'completed' })
    .eq('stripe_payment_intent_id', chargeData.reference)

  if (depositUpdateError) {
    console.error('Failed to update deposit status:', depositUpdateError)
    // Don't throw - the balance was already updated
  }

  // Log the deposit transaction
  const transactionInsert: TransactionInsert = {
    user_id: advertiserId,
    transaction_type: 'deposit',
    amount: depositAmount,
    balance_after: newBalance,
    description: `Deposit via Paystack`,
    metadata: {
      paystack_reference: chargeData.reference,
      payment_method: 'paystack',
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: transactionError } = await (supabase as any)
    .from('transactions')
    .insert(transactionInsert)

  if (transactionError) {
    console.error('Failed to log transaction:', transactionError)
    // Don't throw - the balance was already updated
  }

  console.log(`Successfully credited ₦${depositAmount} to advertiser ${advertiserId}`)
}
