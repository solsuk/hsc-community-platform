import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { validateAuth } from '@/lib/auth';

interface TrackingRequest {
  event_type: 'view' | 'click' | 'contact' | 'share' | 'impression';
  session_id?: string;
  time_on_listing?: number;
  scroll_depth?: number;
}

// POST /api/listings/[id]/track - Track user interactions with listings
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const listingId = params.id;

  try {
    // Parse request body
    let trackingData: TrackingRequest;
    try {
      trackingData = await request.json();
    } catch {
      trackingData = { event_type: 'click' }; // Default to click if no body
    }

    const { event_type, session_id, time_on_listing, scroll_depth } = trackingData;

    // Validate event type
    if (!['view', 'click', 'contact', 'share', 'impression'].includes(event_type)) {
      return NextResponse.json({ 
        error: 'Invalid event type' 
      }, { status: 400 });
    }

    // Get user info (optional - tracking works for anonymous users too)
    const authResult = await validateAuth(request);
    
    // Get request metadata
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('remote-addr') ||
               'unknown';
    const referrer = request.headers.get('referer');
    
    // Simple device type detection
    const deviceType = userAgent.toLowerCase().includes('mobile') ? 'mobile' :
                      userAgent.toLowerCase().includes('tablet') ? 'tablet' : 'desktop';
    
    // Simple browser detection
    const getBrowserName = (userAgent: string): string => {
      const ua = userAgent.toLowerCase();
      if (ua.includes('chrome')) return 'chrome';
      if (ua.includes('firefox')) return 'firefox';
      if (ua.includes('safari')) return 'safari';
      if (ua.includes('edge')) return 'edge';
      return 'unknown';
    };

    const supabase = createAdminSupabaseClient();

    // First, verify the listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, status')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ 
        error: 'Listing not found' 
      }, { status: 404 });
    }

    // Log the analytics event
    const { error: analyticsError } = await supabase
      .from('listing_analytics')
      .insert({
        listing_id: listingId,
        event_type,
        event_timestamp: new Date().toISOString(),
        user_id: authResult?.user?.id || null,
        session_id: session_id || null,
        ip_address: ip,
        user_agent: userAgent,
        referrer: referrer || null,
        device_type: deviceType,
        browser_name: getBrowserName(userAgent),
        time_on_listing: time_on_listing || null,
        scroll_depth: scroll_depth || null
      });

    if (analyticsError) {
      console.error('Analytics logging error:', analyticsError);
      // Continue anyway - don't fail the request for analytics issues
    }

    // Update the listing's click counter and last_clicked_at for 'click' events
    if (event_type === 'click') {
      // First get current click count
      const { data: currentListing } = await supabase
        .from('listings')
        .select('clicks')
        .eq('id', listingId)
        .single();

      const currentClicks = currentListing?.clicks || 0;

      const { error: clickError } = await supabase
        .from('listings')
        .update({ 
          clicks: currentClicks + 1,
          last_clicked_at: new Date().toISOString()
        })
        .eq('id', listingId);

      if (clickError) {
        console.error('Click counter update error:', clickError);
        // Continue anyway
      }
    }

    // Update impression count for 'impression' events
    if (event_type === 'impression') {
      // First get current impression count
      const { data: currentListing } = await supabase
        .from('listings')
        .select('impression_count')
        .eq('id', listingId)
        .single();

      const currentImpressions = currentListing?.impression_count || 0;

      const { error: impressionError } = await supabase
        .from('listings')
        .update({ 
          impression_count: currentImpressions + 1
        })
        .eq('id', listingId);

      if (impressionError) {
        console.error('Impression counter update error:', impressionError);
        // Continue anyway
      }
    }

    // Get updated click count to return
    const { data: updatedListing } = await supabase
      .from('listings')
      .select('clicks, impression_count, engagement_score')
      .eq('id', listingId)
      .single();

    return NextResponse.json({
      success: true,
      event_logged: event_type,
      new_click_count: updatedListing?.clicks || 0,
      impression_count: updatedListing?.impression_count || 0,
      engagement_score: updatedListing?.engagement_score || 0
    });

  } catch (error) {
    console.error('Listing tracking error:', error);
    
    // Return success even on error to not disrupt user experience
    return NextResponse.json({
      success: false,
      error: 'Tracking failed',
      event_logged: 'none'
    });
  }
}

// GET /api/listings/[id]/track - Get tracking stats for a listing (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const listingId = params.id;

  try {
    // Validate admin authentication for viewing tracking data
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user?.isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();

    // Get listing analytics summary
    const analyticsPromises = [
      // Total events by type
      supabase
        .from('listing_analytics')
        .select('event_type')
        .eq('listing_id', listingId),
      
      // Daily breakdown for last 7 days
      supabase
        .from('listing_analytics')
        .select('event_timestamp, event_type')
        .eq('listing_id', listingId)
        .gte('event_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('event_timestamp', { ascending: false }),
      
      // Device breakdown
      supabase
        .from('listing_analytics')
        .select('device_type, browser_name')
        .eq('listing_id', listingId),
      
      // Unique users
      supabase
        .from('listing_analytics')
        .select('user_id')
        .eq('listing_id', listingId)
        .not('user_id', 'is', null),

      // Current listing stats
      supabase
        .from('listings')
        .select('title, clicks, impression_count, engagement_score, created_at')
        .eq('id', listingId)
        .single()
    ];

    const [
      allEventsResult,
      recentEventsResult,
      deviceDataResult,
      uniqueUsersResult,
      listingResult
    ] = await Promise.all(analyticsPromises);

    if (listingResult.error) {
      return NextResponse.json({ 
        error: 'Listing not found' 
      }, { status: 404 });
    }

    // Process analytics data
    const eventCounts = (Array.isArray(allEventsResult.data) ? allEventsResult.data : []).reduce((acc: Record<string, number>, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const deviceBreakdown = (Array.isArray(deviceDataResult.data) ? deviceDataResult.data : []).reduce((acc: Record<string, number>, event: any) => {
      acc[event.device_type] = (acc[event.device_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const browserBreakdown = (Array.isArray(deviceDataResult.data) ? deviceDataResult.data : []).reduce((acc: Record<string, number>, event: any) => {
      acc[event.browser_name] = (acc[event.browser_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueUserCount = (Array.isArray(uniqueUsersResult.data) && uniqueUsersResult.data.length > 0) ? 
      new Set(uniqueUsersResult.data.map((row: any) => row.user_id)).size : 0;

    // Daily breakdown for chart
    const dailyBreakdown = (Array.isArray(recentEventsResult.data) ? recentEventsResult.data : []).reduce((acc: Record<string, { clicks: number; views: number; other: number }>, event: any) => {
      const date = event.event_timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = { clicks: 0, views: 0, other: 0 };
      }
      if (event.event_type === 'click') {
        acc[date].clicks++;
      } else if (event.event_type === 'view' || event.event_type === 'impression') {
        acc[date].views++;
      } else {
        acc[date].other++;
      }
      return acc;
    }, {} as Record<string, { clicks: number, views: number, other: number }>);

    return NextResponse.json({
      success: true,
      listing: {
        id: listingId,
        title: (listingResult.data as any)?.title || 'Unknown',
        clicks: (listingResult.data as any)?.clicks || 0,
        impression_count: (listingResult.data as any)?.impression_count || 0,
        engagement_score: (listingResult.data as any)?.engagement_score || 0,
        created_at: (listingResult.data as any)?.created_at || new Date().toISOString()
      },
      analytics: {
        event_counts: eventCounts,
        unique_users: uniqueUserCount,
        device_breakdown: deviceBreakdown,
        browser_breakdown: browserBreakdown,
        daily_breakdown: dailyBreakdown,
        total_events: Array.isArray(allEventsResult.data) ? allEventsResult.data.length : 0
      }
    });

  } catch (error) {
    console.error('Listing analytics GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to load analytics' 
    }, { status: 500 });
  }
} 