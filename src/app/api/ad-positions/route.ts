import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';

export interface AdPosition {
  id: string;
  listing_id: string;
  user_id: string;
  weekly_bid_amount: number;
  current_position: number;
  week_start: string;
  week_end: string;
  listing: {
    id: string;
    title: string;
    type: string;
    featured_image_url?: string;
    basic_description?: string;
  } | null;
}

export interface MarketState {
  current_top_bid: number;
  price_to_beat: number;
  total_active_bids: number;
  positions: AdPosition[];
  week_start: string;
  week_end: string;
}

// GET /api/ad-positions - Get current market state and positions
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Optional week filter (defaults to current week)
    const weekStart = searchParams.get('week_start') || getCurrentWeekStart();
    
    // Get current market state using our database functions
    const { data: topBidData, error: topBidError } = await supabase
      .rpc('get_current_top_bid');
    
    if (topBidError) {
      console.error('Error getting top bid:', topBidError);
      return NextResponse.json({ error: 'Failed to get market state' }, { status: 500 });
    }

    const { data: priceToBeatData, error: priceToBeatError } = await supabase
      .rpc('get_price_to_beat');
    
    if (priceToBeatError) {
      console.error('Error getting price to beat:', priceToBeatError);
      return NextResponse.json({ error: 'Failed to get market pricing' }, { status: 500 });
    }

    // Get all active bids with position data
    const { data: activeBids, error: bidsError } = await supabase
      .from('ad_bids')
      .select(`
        id,
        listing_id,
        user_id,
        weekly_bid_amount,
        current_position,
        week_start,
        week_end,
        listings:listing_id (
          id,
          title,
          type,
          featured_image_url,
          basic_description
        )
      `)
      .eq('status', 'active')
      .gte('week_end', new Date().toISOString())
      .order('current_position', { ascending: true });

    if (bidsError) {
      console.error('Error getting active bids:', bidsError);
      return NextResponse.json({ error: 'Failed to get active bids' }, { status: 500 });
    }

    // Calculate week boundaries
    const weekEnd = getWeekEnd(weekStart);

    const marketState: MarketState = {
      current_top_bid: topBidData || 0,
      price_to_beat: priceToBeatData || 5.00,
      total_active_bids: activeBids?.length || 0,
      positions: (activeBids || []).map(bid => ({
        ...bid,
        listing: Array.isArray(bid.listings) ? bid.listings[0] || null : bid.listings
      })) as AdPosition[],
      week_start: weekStart,
      week_end: weekEnd
    };

    return NextResponse.json({
      success: true,
      market_state: marketState
    });

  } catch (error) {
    console.error('Error in GET /api/ad-positions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function getCurrentWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1, Sunday = 0
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