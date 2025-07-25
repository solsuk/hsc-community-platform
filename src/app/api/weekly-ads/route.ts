import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { validateAuth } from '@/lib/auth';

interface WeeklyAdSubscription {
  id: string;
  user_id: string;
  listing_id: string;
  position_slot: number;
  weekly_price: number;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  stripe_subscription_id?: string;
  stripe_payment_intent_id?: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending_payment';
  created_at: string;
  updated_at: string;
}

// GET /api/weekly-ads - Fetch user's weekly ad subscriptions
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const includeExpired = searchParams.get('include_expired') === 'true';
    const subscriptionId = searchParams.get('subscription_id');

    let query = supabase
      .from('weekly_ad_subscriptions')
      .select(`
        *,
        listings:listing_id (
          id,
          title,
          type,
          featured_image_url,
          basic_description,
          status
        )
      `)
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (subscriptionId) {
      query = query.eq('id', subscriptionId);
    }
    
    if (!includeExpired) {
      query = query.neq('status', 'expired');
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Weekly ads fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Weekly ads API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/weekly-ads - Create new weekly ad subscription
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      listing_id,
      target_position,
      start_date,
      end_date,
      auto_renew = false,
      stripe_payment_intent_id
    } = body;

    // Validation
    if (!listing_id || !target_position || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (target_position < 1 || target_position > 5) {
      return NextResponse.json({ error: 'Invalid target position. Must be between 1 and 5.' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Verify the listing exists and belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, type, status, title')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.user_id !== authResult.user.id) {
      return NextResponse.json({ error: 'You can only create subscriptions for your own listings' }, { status: 403 });
    }

    if (listing.type !== 'advertise') {
      return NextResponse.json({ error: 'Only advertisement listings can have weekly subscriptions' }, { status: 400 });
    }

    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing must be active to create a subscription' }, { status: 400 });
    }

    // Check if target position is available or calculate bump price
    const { data: availableSlots, error: slotsError } = await supabase
      .rpc('get_available_ad_slots', { for_date: start_date });

    if (slotsError) {
      console.error('Error checking available slots:', slotsError);
      return NextResponse.json({ error: 'Failed to check available slots' }, { status: 500 });
    }

    const targetSlot = availableSlots.find((slot: any) => slot.position_slot === target_position);
    if (!targetSlot) {
      return NextResponse.json({ error: 'Invalid position slot' }, { status: 400 });
    }

    const isBump = !targetSlot.is_available;
    const weeklyPrice = isBump ? 10.00 : 5.00;

    // Use the database function to handle position bumping
    const { data: newSubscriptionId, error: subscriptionError } = await supabase
      .rpc('bump_ad_position', {
        p_user_id: authResult.user.id,
        p_listing_id: listing_id,
        p_target_position: target_position,
        p_start_date: start_date,
        p_end_date: end_date,
        p_stripe_payment_intent_id: stripe_payment_intent_id
      });

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Fetch the created subscription with related data
    const { data: subscription, error: fetchError } = await supabase
      .from('weekly_ad_subscriptions')
      .select(`
        *,
        listings:listing_id (
          id,
          title,
          type,
          featured_image_url,
          basic_description
        )
      `)
      .eq('id', newSubscriptionId)
      .single();

    if (fetchError) {
      console.error('Error fetching created subscription:', fetchError);
      return NextResponse.json({ error: 'Subscription created but failed to fetch details' }, { status: 500 });
    }

    return NextResponse.json({ 
      subscription,
      is_bump: isBump,
      weekly_price: weeklyPrice,
      message: isBump ? 'Position bumped successfully!' : 'Subscription created successfully!'
    }, { status: 201 });
  } catch (error) {
    console.error('Weekly subscription creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/weekly-ads/[id] - Update subscription (cancel, renew, etc.)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id, action, auto_renew, stripe_subscription_id } = body;

    if (!subscription_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Verify the subscription exists and belongs to the user
    const { data: subscription, error: subscriptionError } = await supabase
      .from('weekly_ad_subscriptions')
      .select('id, user_id, status')
      .eq('id', subscription_id)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.user_id !== authResult.user.id) {
      return NextResponse.json({ error: 'You can only update your own subscriptions' }, { status: 403 });
    }

    // Handle different actions
    let updateData: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'cancel':
        updateData.status = 'cancelled';
        updateData.auto_renew = false;
        break;
      case 'reactivate':
        if (subscription.status !== 'cancelled') {
          return NextResponse.json({ error: 'Only cancelled subscriptions can be reactivated' }, { status: 400 });
        }
        updateData.status = 'active';
        break;
      case 'update_renewal':
        updateData.auto_renew = auto_renew;
        if (stripe_subscription_id) {
          updateData.stripe_subscription_id = stripe_subscription_id;
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('weekly_ad_subscriptions')
      .update(updateData)
      .eq('id', subscription_id)
      .select(`
        *,
        listings:listing_id (
          id,
          title,
          type,
          featured_image_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Subscription update error:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({ 
      subscription: updatedSubscription,
      message: `Subscription ${action}ed successfully!`
    });
  } catch (error) {
    console.error('Weekly subscription update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 