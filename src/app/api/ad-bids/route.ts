import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { validateAuth } from '@/lib/auth';

export interface BidSubmission {
  listing_id: string;
  weekly_bid_amount: number;
  max_auto_bid?: number;
  auto_renew?: boolean;
}

export interface UserBid {
  id: string;
  listing_id: string;
  weekly_bid_amount: number;
  max_auto_bid?: number;
  auto_renew: boolean;
  current_position?: number;
  week_start: string;
  week_end: string;
  status: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    type: string;
    featured_image_url?: string;
  } | null;
}

// GET /api/ad-bids - Get user's current bids
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('include_expired') === 'true';

    let query = supabase
      .from('ad_bids')
      .select(`
        id,
        listing_id,
        weekly_bid_amount,
        max_auto_bid,
        auto_renew,
        current_position,
        week_start,
        week_end,
        status,
        created_at,
        listings:listing_id (
          id,
          title,
          type,
          featured_image_url
        )
      `)
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false });

    if (!includeExpired) {
      query = query.in('status', ['active', 'paused']);
    }

    const { data: bids, error } = await query;

    if (error) {
      console.error('Error fetching user bids:', error);
      return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bids: (bids || []).map(bid => ({
        ...bid,
        listing: Array.isArray(bid.listings) ? bid.listings[0] || null : bid.listings
      })) as UserBid[]
    });

  } catch (error) {
    console.error('Error in GET /api/ad-bids:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ad-bids - Submit a new bid or update existing bid
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const bidData: BidSubmission = await request.json();
    
    // Validate required fields
    if (!bidData.listing_id || !bidData.weekly_bid_amount) {
      return NextResponse.json({ 
        error: 'listing_id and weekly_bid_amount are required' 
      }, { status: 400 });
    }

    // Validate bid amount
    if (bidData.weekly_bid_amount < 5.00) {
      return NextResponse.json({ 
        error: 'Minimum bid is $5.00 per week' 
      }, { status: 400 });
    }

    // Validate max_auto_bid if provided
    if (bidData.max_auto_bid && bidData.max_auto_bid < bidData.weekly_bid_amount) {
      return NextResponse.json({ 
        error: 'max_auto_bid must be greater than or equal to weekly_bid_amount' 
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if listing exists and belongs to user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, type')
      .eq('id', bidData.listing_id)
      .eq('user_id', authResult.user.id)
      .eq('type', 'advertise')
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ 
        error: 'Listing not found or not authorized. Only advertise-type listings can be bid on.' 
      }, { status: 404 });
    }

    // Calculate current week boundaries
    const weekStart = getCurrentWeekStart();
    const weekEnd = getWeekEnd(weekStart);

    // Check for existing bid this week
    const { data: existingBid, error: existingBidError } = await supabase
      .from('ad_bids')
      .select('id')
      .eq('listing_id', bidData.listing_id)
      .eq('week_start', weekStart)
      .eq('status', 'active')
      .maybeSingle();

    if (existingBidError) {
      console.error('Error checking existing bid:', existingBidError);
      return NextResponse.json({ error: 'Failed to check existing bids' }, { status: 500 });
    }

    let result;
    if (existingBid) {
      // Update existing bid
      const { data, error } = await supabase
        .from('ad_bids')
        .update({
          weekly_bid_amount: bidData.weekly_bid_amount,
          max_auto_bid: bidData.max_auto_bid || null,
          auto_renew: bidData.auto_renew ?? true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingBid.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating bid:', error);
        return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new bid
      const { data, error } = await supabase
        .from('ad_bids')
        .insert({
          listing_id: bidData.listing_id,
          user_id: authResult.user.id,
          weekly_bid_amount: bidData.weekly_bid_amount,
          max_auto_bid: bidData.max_auto_bid || null,
          auto_renew: bidData.auto_renew ?? true,
          week_start: weekStart,
          week_end: weekEnd,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating bid:', error);
        return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      bid: result,
      message: existingBid ? 'Bid updated successfully' : 'Bid placed successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/ad-bids:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/ad-bids - Cancel a bid
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bidId = searchParams.get('bid_id');
    
    if (!bidId) {
      return NextResponse.json({ error: 'bid_id is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Cancel the bid (set status to cancelled)
    const { data, error } = await supabase
      .from('ad_bids')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bidId)
      .eq('user_id', authResult.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling bid:', error);
      return NextResponse.json({ error: 'Failed to cancel bid' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Bid not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bid cancelled successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/ad-bids:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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