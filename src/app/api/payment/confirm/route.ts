import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';

interface PaymentConfirmRequest {
  session_id: string;
}

// POST /api/payment/confirm - Confirm payment and activate business ad
export async function POST(request: NextRequest) {
  try {
    const { session_id }: PaymentConfirmRequest = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    // Get checkout session details from Stripe
    const checkoutResult = await getCheckoutSession(session_id);
    
    if (!checkoutResult.success || !checkoutResult.session) {
      return NextResponse.json({ 
        error: 'Invalid payment session' 
      }, { status: 400 });
    }

    const session = checkoutResult.session;

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        error: 'Payment not completed' 
      }, { status: 400 });
    }

    // Extract metadata
    const metadata = session.metadata;
    if (!metadata?.listing_id || !metadata?.user_id || !metadata?.weekly_amount) {
      return NextResponse.json({ 
        error: 'Invalid payment metadata' 
      }, { status: 400 });
    }

    const listingId = metadata.listing_id;
    const userId = metadata.user_id;
    const weeklyAmount = parseFloat(metadata.weekly_amount);
    const autoRenew = metadata.auto_renew === 'true';
    const competitiveBid = metadata.competitive_bid === 'true';
    const paymentType = metadata.payment_type;

    const supabase = createAdminSupabaseClient();

    // Verify listing exists and belongs to user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, type, business_name')
      .eq('id', listingId)
      .eq('user_id', userId)
      .eq('type', 'advertise')
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ 
        error: 'Business listing not found' 
      }, { status: 404 });
    }

    // Check if payment was already processed (prevent double processing)
    const { data: existingPayment } = await supabase
      .from('ad_payments')
      .select('id')
      .eq('stripe_session_id', session_id)
      .single();

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        payment: {
          session_id,
          amount: weeklyAmount,
          listing_id: listingId,
          business_name: listing.business_name,
          competitive_bid: competitiveBid,
          payment_type: paymentType
        }
      });
    }

    // Record the payment in our database
    const paymentRecord = {
      listing_id: listingId,
      user_id: userId,
      amount: weeklyAmount,
      currency: 'usd',
      stripe_session_id: session_id,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_subscription_id: session.subscription as string || null,
      payment_type: paymentType,
      auto_renew: autoRenew,
      status: 'completed',
      created_at: new Date().toISOString()
    };

    // Create ad_payments table record
    const { error: paymentError } = await supabase
      .from('ad_payments')
      .insert(paymentRecord);

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      // Continue with activation even if payment recording fails
    }

    // If this is a competitive bid, create/update bid record
    if (competitiveBid) {
      const currentWeekStart = getCurrentWeekStart();
      const currentWeekEnd = getWeekEnd(currentWeekStart);

      const bidRecord = {
        listing_id: listingId,
        user_id: userId,
        weekly_bid_amount: weeklyAmount,
        auto_renew: autoRenew,
        week_start: currentWeekStart,
        week_end: currentWeekEnd,
        status: 'active'
      };

      // Check for existing bid this week
      const { data: existingBid } = await supabase
        .from('ad_bids')
        .select('id')
        .eq('listing_id', listingId)
        .eq('week_start', currentWeekStart)
        .eq('status', 'active')
        .single();

      if (existingBid) {
        // Update existing bid
        await supabase
          .from('ad_bids')
          .update({ 
            weekly_bid_amount: weeklyAmount,
            auto_renew: autoRenew,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBid.id);
      } else {
        // Create new bid
        await supabase
          .from('ad_bids')
          .insert(bidRecord);
      }

      // Trigger position recalculation
      await supabase.rpc('calculate_ad_positions');
    }

    // Update listing status to indicate it's a paid ad
    await supabase
      .from('listings')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    // Log successful activation
    console.log(`Ad activated: User ${userId}, Listing ${listingId}, Amount $${weeklyAmount}, Competitive: ${competitiveBid}`);

    return NextResponse.json({
      success: true,
      message: 'Ad activated successfully',
      payment: {
        session_id,
        amount: weeklyAmount,
        listing_id: listingId,
        business_name: listing.business_name,
        competitive_bid: competitiveBid,
        payment_type: paymentType
      }
    });

  } catch (error) {
    console.error('Error in POST /api/payment/confirm:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper functions
function getCurrentWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return monday.toISOString().split('T')[0];
}

function getWeekEnd(weekStart: string): string {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return endDate.toISOString().split('T')[0];
} 