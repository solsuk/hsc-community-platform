import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = headers().get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // Initialize Supabase client
  const supabase = createServerSupabaseClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break
        
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object as Stripe.Invoice, supabase)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription, supabase)
        break
        
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any) {
  console.log('💰 Payment completed for session:', session.id)
  
  // Extract metadata from checkout session
  const { listing_id, user_email, placement_type, bid_amount } = session.metadata || {}
  
  if (!listing_id) {
    console.error('No listing_id in session metadata')
    return
  }

  // Record payment
  const { error: paymentError } = await supabase
    .from('ad_payments')
    .insert({
      session_id: session.id,
      listing_id: listing_id,
      amount: session.amount_total,
      currency: session.currency,
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent,
      user_email: user_email
    })

  if (paymentError) {
    console.error('Failed to record payment:', paymentError)
    return
  }

  // Activate the ad by updating listing status
  const { error: listingError } = await supabase
    .from('listings')
    .update({ 
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', listing_id)

  if (listingError) {
    console.error('Failed to activate listing:', listingError)
    return
  }

  // Update or create bid record
  if (placement_type === 'premium' && bid_amount) {
    await supabase
      .from('ad_bids')
      .upsert({
        listing_id: listing_id,
        bid_amount: parseInt(bid_amount),
        is_active: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
  }

  console.log('✅ Ad activated successfully for listing:', listing_id)
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice, supabase: any) {
  console.log('🔄 Subscription payment succeeded for:', (invoice as any).subscription)
  
  // Handle auto-renewal - extend ad placement for another week
  const subscriptionId = (invoice as any).subscription as string
  
  // Find the ad payment record
  const { data: payment } = await supabase
    .from('ad_payments')
    .select('listing_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (payment?.listing_id) {
    // Extend the bid expiration
    await supabase
      .from('ad_bids')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('listing_id', payment.listing_id)

    console.log('✅ Ad placement extended for listing:', payment.listing_id)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  console.log('❌ Payment failed for subscription:', (invoice as any).subscription)
  
  // Deactivate the ad if payment fails
  const subscriptionId = (invoice as any).subscription as string
  
  const { data: payment } = await supabase
    .from('ad_payments')
    .select('listing_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (payment?.listing_id) {
    await supabase
      .from('ad_bids')
      .update({
        is_active: false,
        deactivated_reason: 'payment_failed',
        updated_at: new Date().toISOString()
      })
      .eq('listing_id', payment.listing_id)

    console.log('⚠️ Ad deactivated due to failed payment:', payment.listing_id)
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription, supabase: any) {
  console.log('🛑 Subscription cancelled:', subscription.id)
  
  // Mark subscription as cancelled in our records
  const { data: payment } = await supabase
    .from('ad_payments')
    .select('listing_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (payment?.listing_id) {
    await supabase
      .from('ad_bids')
      .update({
        is_active: false,
        deactivated_reason: 'subscription_cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('listing_id', payment.listing_id)

    console.log('📝 Subscription marked as cancelled for listing:', payment.listing_id)
  }
} 