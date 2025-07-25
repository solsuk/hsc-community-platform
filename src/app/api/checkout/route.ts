import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth';
import { createCheckoutSession, AD_PRICING, validatePaymentAmount } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase';

export interface CheckoutRequest {
  listing_id: string;
  weekly_amount: number;
  payment_type: 'one_time' | 'subscription';
  auto_renew: boolean;
}

// POST /api/checkout - Create Stripe checkout session for business ad payment
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const checkoutData: CheckoutRequest = await request.json();
    console.log('🔍 CHECKOUT DEBUG - Received data:', checkoutData);
    
    // Validate required fields
    if (!checkoutData.listing_id || !checkoutData.weekly_amount || !checkoutData.payment_type) {
      return NextResponse.json({ 
        error: 'listing_id, weekly_amount, and payment_type are required' 
      }, { status: 400 });
    }

    // Validate payment amount
    if (!validatePaymentAmount(checkoutData.weekly_amount)) {
      return NextResponse.json({ 
        error: `Invalid payment amount. Must be at least $${AD_PRICING.BASE_WEEKLY_RATE} and in $${AD_PRICING.COMPETITIVE_INCREMENT} increments` 
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // First, let's see what listing actually exists
    console.log('🔍 CHECKOUT DEBUG - Looking for listing with ID:', checkoutData.listing_id);
    console.log('🔍 CHECKOUT DEBUG - User ID:', authResult.user.id);
    
    const { data: anyListing, error: anyListingError } = await supabase
      .from('listings')
      .select('id, user_id, type, title, status')
      .eq('id', checkoutData.listing_id)
      .single();
    
    console.log('🔍 CHECKOUT DEBUG - Found listing:', anyListing);
    console.log('🔍 CHECKOUT DEBUG - Listing error:', anyListingError);

    // Verify listing exists and belongs to user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, type, title')
      .eq('id', checkoutData.listing_id)
      .eq('user_id', authResult.user.id)
      .eq('type', 'advertise')
      .single();

    console.log('🔍 CHECKOUT DEBUG - Filtered listing:', listing);
    console.log('🔍 CHECKOUT DEBUG - Filtered error:', listingError);

    if (listingError || !listing) {
      console.error('❌ CHECKOUT DEBUG - Validation failed!');
      if (anyListing) {
        console.error('💡 CHECKOUT DEBUG - The listing exists but with type:', anyListing.type);
        console.error('💡 CHECKOUT DEBUG - Expected type: advertise');
        console.error('💡 CHECKOUT DEBUG - User ID match:', anyListing.user_id === authResult.user.id);
      }
      return NextResponse.json({ 
        error: 'Business listing not found or unauthorized. Only advertise-type listings can be paid for.' 
      }, { status: 404 });
    }

    // Get current market state to determine if this is competitive bidding
    const { data: marketData } = await supabase.rpc('get_current_top_bid');
    const currentTopBid = marketData || 0;
    const isCompetitiveBid = checkoutData.weekly_amount > AD_PRICING.BASE_WEEKLY_RATE;

    // Get user email from auth session (no database lookup needed)
    const userEmail = authResult.user.email;
    
    if (!userEmail) {
      console.log('❌ CHECKOUT DEBUG - No email in auth session:', authResult.user);
      return NextResponse.json({ 
        error: 'User email not available in session' 
      }, { status: 400 });
    }
    
    console.log('✅ CHECKOUT DEBUG - Using email from auth session:', userEmail);

    // Create Stripe checkout session
    const checkoutResult = await createCheckoutSession({
      listing_id: checkoutData.listing_id,
      user_id: authResult.user.id,
      user_email: userEmail,
      weekly_amount: checkoutData.weekly_amount,
      payment_type: checkoutData.payment_type,
      auto_renew: checkoutData.auto_renew,
      competitive_bid: isCompetitiveBid,
    });

    if (!checkoutResult.success) {
      return NextResponse.json({ 
        error: `Payment setup failed: ${checkoutResult.error}` 
      }, { status: 500 });
    }

    // Log the checkout attempt for admin tracking
    console.log(`Checkout created for user ${authResult.user.id}, listing ${checkoutData.listing_id}, amount $${checkoutData.weekly_amount}`);

    return NextResponse.json({
      success: true,
      checkout_url: checkoutResult.url,
      session_id: checkoutResult.session_id,
      amount: checkoutData.weekly_amount,
      is_competitive: isCompetitiveBid,
      current_top_bid: currentTopBid
    });

  } catch (error) {
    console.error('Error in POST /api/checkout:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET /api/checkout - Get pricing information for a listing
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');

    if (!listingId) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verify listing exists and belongs to user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, type, title')
      .eq('id', listingId)
      .eq('user_id', authResult.user.id)
      .eq('type', 'advertise')
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ 
        error: 'Business listing not found or unauthorized' 
      }, { status: 404 });
    }

    // Get current market state
    const { data: topBidData } = await supabase.rpc('get_current_top_bid');
    const { data: priceToBeatData } = await supabase.rpc('get_price_to_beat');
    
    const currentTopBid = topBidData || 0;
    const priceToBeat = priceToBeatData || AD_PRICING.BASE_WEEKLY_RATE;

    // Get total active bids for context
    const { data: activeBids } = await supabase
      .from('ad_bids')
      .select('id, weekly_bid_amount, current_position')
      .eq('status', 'active')
      .gte('week_end', new Date().toISOString())
      .order('weekly_bid_amount', { ascending: false });

    return NextResponse.json({
      success: true,
      pricing: {
        base_rate: AD_PRICING.BASE_WEEKLY_RATE,
        competitive_increment: AD_PRICING.COMPETITIVE_INCREMENT,
        current_top_bid: currentTopBid,
        price_to_beat: priceToBeat,
        total_active_bids: activeBids?.length || 0,
        pricing_options: [
          {
            name: 'Standard Placement',
            amount: AD_PRICING.BASE_WEEKLY_RATE,
            description: 'Regular grid position',
            competitive: false
          },
          ...(currentTopBid > 0 ? [
            {
              name: 'Beat Competition',
              amount: priceToBeat,
              description: `Take top position (beats current $${currentTopBid}/week)`,
              competitive: true
            }
          ] : [])
        ]
      },
      listing: {
        id: listing.id,
        title: listing.title,
        type: listing.type
      }
    });

  } catch (error) {
    console.error('Error in GET /api/checkout:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 