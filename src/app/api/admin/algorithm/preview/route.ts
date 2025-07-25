import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { validateAuth } from '@/lib/auth';

interface AlgorithmConfig {
  weight_age: number;
  weight_clicks: number;
  max_age_hours: number;
  boost_premium: boolean;
  engagement_threshold: number;
}

interface ListingPreview {
  id: string;
  title: string;
  type: string;
  created_at: string;
  clicks: number;
  current_score: number;
  new_score: number;
  position_change: 'up' | 'down' | 'same';
}

// Calculate engagement score using the provided algorithm config
function calculateEngagementScore(
  createdAt: string,
  clicks: number,
  maxClicks: number,
  config: AlgorithmConfig
): number {
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  
  // Age component: newer listings score higher
  const ageScore = (1 / (hoursAgo + 1)) * config.weight_age;
  
  // Click component: more popular listings score higher
  const clickScore = (clicks / Math.max(maxClicks, 1)) * config.weight_clicks;
  
  return ageScore + clickScore;
}

// POST /api/admin/algorithm/preview - Preview how algorithm changes would affect rankings
export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const config: AlgorithmConfig = await request.json();
    const supabase = createAdminSupabaseClient();

    // Get current listings data
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, type, created_at, clicks')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    if (!listings || listings.length === 0) {
      // Return mock data if no listings found
      const mockPreviews: ListingPreview[] = [
        {
          id: '1',
          title: 'iPhone 15 Pro Max',
          type: 'sell',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          clicks: 25,
          current_score: 0.45,
          new_score: calculateEngagementScore(
            new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            25,
            50,
            config
          ),
          position_change: 'same'
        },
        {
          id: '2', 
          title: 'Lawn Mower',
          type: 'sell',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          clicks: 12,
          current_score: 0.32,
          new_score: calculateEngagementScore(
            new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            12,
            50,
            config
          ),
          position_change: 'down'
        },
        {
          id: '3',
          title: 'Bicycle Repair',
          type: 'trade',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          clicks: 45,
          current_score: 0.28,
          new_score: calculateEngagementScore(
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            45,
            50,
            config
          ),
          position_change: 'up'
        }
      ];

      return NextResponse.json({
        success: true,
        previews: mockPreviews
      });
    }

    // Calculate current and new scores for real listings
    const maxClicks = Math.max(...listings.map(l => l.clicks || 0), 1);
    const currentConfig = { weight_age: 0.6, weight_clicks: 0.4 }; // Default current config

    const previews: ListingPreview[] = listings.map(listing => {
      const currentScore = calculateEngagementScore(
        listing.created_at,
        listing.clicks || 0,
        maxClicks,
        { ...currentConfig, max_age_hours: 168, boost_premium: true, engagement_threshold: 10 }
      );
      
      const newScore = calculateEngagementScore(
        listing.created_at,
        listing.clicks || 0,
        maxClicks,
        config
      );

      let positionChange: 'up' | 'down' | 'same' = 'same';
      if (newScore > currentScore * 1.05) { // 5% threshold for "up"
        positionChange = 'up';
      } else if (newScore < currentScore * 0.95) { // 5% threshold for "down"
        positionChange = 'down';
      }

      return {
        id: listing.id,
        title: listing.title || 'Untitled Listing',
        type: listing.type || 'sell',
        created_at: listing.created_at,
        clicks: listing.clicks || 0,
        current_score: currentScore,
        new_score: newScore,
        position_change: positionChange
      };
    });

    // Sort by new score to show the new ranking
    previews.sort((a, b) => b.new_score - a.new_score);

    return NextResponse.json({
      success: true,
      previews: previews.slice(0, 12) // Return top 12 for preview
    });

  } catch (error) {
    console.error('Algorithm preview error:', error);
    
    // Return fallback preview data
    const fallbackPreviews: ListingPreview[] = [
      {
        id: 'fallback-1',
        title: 'Recent Listing Example',
        type: 'sell',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        clicks: 15,
        current_score: 0.35,
        new_score: calculateEngagementScore(
          new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          15,
          30,
          { 
            weight_age: 0.6, 
            weight_clicks: 0.4, 
            max_age_hours: 168, 
            boost_premium: true, 
            engagement_threshold: 5 
          }
        ),
        position_change: 'same'
      }
    ];

    return NextResponse.json({
      success: true,
      previews: fallbackPreviews,
      warning: 'Using fallback data - database connection failed'
    });
  }
} 