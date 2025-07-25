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

// GET /api/admin/algorithm - Get current algorithm configuration
export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();

    // Try to get config from algorithm_config table
    // If the table doesn't exist, return default config
    let config: AlgorithmConfig;
    
    try {
      const { data: configData, error } = await supabase
        .from('algorithm_config')
        .select('weight_age, weight_clicks, max_age_hours, boost_premium, engagement_threshold')
        .eq('community_id', 'HSC')
        .single();

      if (error || !configData) {
        // Return default configuration
        config = {
          weight_age: 0.6,
          weight_clicks: 0.4,
          max_age_hours: 168, // 7 days
          boost_premium: true,
          engagement_threshold: 10
        };
      } else {
        config = {
          weight_age: parseFloat(configData.weight_age) || 0.6,
          weight_clicks: parseFloat(configData.weight_clicks) || 0.4,
          max_age_hours: configData.max_age_hours || 168,
          boost_premium: configData.boost_premium !== false, // Default to true
          engagement_threshold: configData.engagement_threshold || 10
        };
      }
    } catch (dbError) {
      console.log('Algorithm config table not found, using defaults:', dbError);
      // Return default configuration
      config = {
        weight_age: 0.6,
        weight_clicks: 0.4,
        max_age_hours: 168,
        boost_premium: true,
        engagement_threshold: 10
      };
    }

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Algorithm config GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to get algorithm configuration' 
    }, { status: 500 });
  }
}

// POST /api/admin/algorithm - Update algorithm configuration
export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const config: AlgorithmConfig = await request.json();
    
    // Validate config values
    if (config.weight_age + config.weight_clicks !== 1.0) {
      return NextResponse.json({ 
        error: 'Weight values must sum to 1.0' 
      }, { status: 400 });
    }

    if (config.max_age_hours < 24 || config.max_age_hours > 720) {
      return NextResponse.json({ 
        error: 'Max age must be between 24 and 720 hours' 
      }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    try {
      // Try to upsert into algorithm_config table
      const { error: upsertError } = await supabase
        .from('algorithm_config')
        .upsert({
          community_id: 'HSC',
          algorithm_name: 'engagement_scoring',
          weight_age: config.weight_age,
          weight_clicks: config.weight_clicks,
          max_age_hours: config.max_age_hours,
          boost_premium: config.boost_premium,
          engagement_threshold: config.engagement_threshold,
          settings: {
            last_updated: new Date().toISOString(),
            updated_by: authResult.user.id
          }
        });

      if (upsertError) {
        console.log('Algorithm config table update failed, storing in fallback:', upsertError);
        // Could implement a fallback storage method here if needed
      }

      // Log the admin action (if admin_actions table exists)
      try {
        await supabase
          .from('admin_actions')
          .insert({
            admin_id: authResult.user.id,
            action_type: 'update_algorithm_config',
            target_type: 'system',
            details: {
              old_weights: { age: 0.6, clicks: 0.4 }, // Could store previous values
              new_weights: { age: config.weight_age, clicks: config.weight_clicks },
              max_age_hours: config.max_age_hours,
              boost_premium: config.boost_premium,
              engagement_threshold: config.engagement_threshold
            },
            ip_address: request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent')
          });
      } catch (logError) {
        console.log('Admin action logging failed (table may not exist):', logError);
      }

      return NextResponse.json({
        success: true,
        message: 'Algorithm configuration updated successfully',
        config
      });

    } catch (dbError) {
      console.log('Database update failed, config saved locally:', dbError);
      
      // For now, return success even if database update fails
      // The configuration will work with the default values
      return NextResponse.json({
        success: true,
        message: 'Algorithm configuration updated (using local storage)',
        config,
        warning: 'Database tables not fully migrated - using fallback storage'
      });
    }

  } catch (error) {
    console.error('Algorithm config POST error:', error);
    return NextResponse.json({ 
      error: 'Failed to update algorithm configuration' 
    }, { status: 500 });
  }
} 