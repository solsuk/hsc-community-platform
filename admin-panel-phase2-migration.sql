-- ============================================================================
-- ADMIN PANEL PHASE 2 MIGRATION - CLEAN & SAFE
-- Creates remaining admin panel components after community_id columns are added
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE COMMUNITIES TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    domain VARCHAR(100),
    subdomain VARCHAR(50),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert HSC community if it doesn't exist
INSERT INTO communities (id, name, display_name, description, domain, subdomain, settings)
VALUES (
    'HSC',
    'hillsmere_shores',
    'Hillsmere Shores Classifieds',
    'Hyper-localized community marketplace for Hillsmere Shores residents',
    'localhost:3000',
    'hsc',
    '{"theme": "default", "features": {"algorithm_control": true, "click_tracking": true}}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE LISTING_ANALYTICS TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    community_id VARCHAR(50) DEFAULT 'HSC',
    user_id UUID,
    event_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'contact', 'share'
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for listing_analytics
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing ON listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_community ON listing_analytics(community_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_user ON listing_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event ON listing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_created ON listing_analytics(created_at);

-- ============================================================================
-- 3. CREATE ADMIN_ACTIONS TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL,
    community_id VARCHAR(50) DEFAULT 'HSC',
    action_type VARCHAR(50) NOT NULL, -- 'algorithm_update', 'user_action', 'content_moderation', 'system_config'
    target_type VARCHAR(50), -- 'listing', 'user', 'algorithm', 'system'
    target_id UUID,
    action_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_community ON admin_actions(community_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

-- ============================================================================
-- 4. ADD ENGAGEMENT COLUMNS TO LISTINGS (IF NOT EXISTS)
-- ============================================================================

-- Add engagement-related columns to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(10,6) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for engagement columns
CREATE INDEX IF NOT EXISTS idx_listings_engagement_score ON listings(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_click_count ON listings(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_listings_community_engagement ON listings(community_id, engagement_score DESC);

-- ============================================================================
-- 5. CREATE ENGAGEMENT SCORING FUNCTIONS
-- ============================================================================

-- Function to calculate engagement score based on age and clicks
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    listing_created_at TIMESTAMP WITH TIME ZONE,
    listing_clicks INTEGER DEFAULT 0,
    max_clicks_in_community INTEGER DEFAULT 1
) RETURNS DECIMAL(10,6) AS $$
DECLARE
    hours_since_posted DECIMAL;
    weight_age DECIMAL := 0.6;
    weight_clicks DECIMAL := 0.4;
    age_score DECIMAL;
    click_score DECIMAL;
    final_score DECIMAL;
BEGIN
    hours_since_posted := EXTRACT(EPOCH FROM (NOW() - listing_created_at)) / 3600.0;
    age_score := (1.0 / (hours_since_posted + 1.0)) * weight_age;
    click_score := (listing_clicks::DECIMAL / GREATEST(max_clicks_in_community, 1)::DECIMAL) * weight_clicks;
    final_score := age_score + click_score;
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk update engagement scores for a community
CREATE OR REPLACE FUNCTION update_community_engagement_scores(community_filter VARCHAR(50) DEFAULT 'HSC')
RETURNS INTEGER AS $$
DECLARE
    max_clicks INTEGER;
    updated_count INTEGER;
BEGIN
    -- Get max clicks in the community
    SELECT COALESCE(MAX(click_count), 1) INTO max_clicks
    FROM listings 
    WHERE community_id = community_filter;
    
    -- Update all listings in the community
    UPDATE listings 
    SET engagement_score = calculate_engagement_score(created_at, click_count, max_clicks)
    WHERE community_id = community_filter;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE ADMIN DASHBOARD FUNCTIONS
-- ============================================================================

-- Function to get admin dashboard metrics
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics(community_filter VARCHAR(50) DEFAULT 'HSC')
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'total_listings', (SELECT COUNT(*) FROM listings WHERE community_id = community_filter),
        'active_listings', (SELECT COUNT(*) FROM listings WHERE community_id = community_filter AND status = 'active'),
        'total_users', (SELECT COUNT(*) FROM users WHERE community_id = community_filter),
        'admin_users', (SELECT COUNT(*) FROM users WHERE community_id = community_filter AND is_admin = true),
        'total_clicks', (SELECT COALESCE(SUM(click_count), 0) FROM listings WHERE community_id = community_filter),
        'avg_engagement', (SELECT ROUND(AVG(engagement_score), 4) FROM listings WHERE community_id = community_filter),
        'recent_actions', (SELECT COUNT(*) FROM admin_actions WHERE community_id = community_filter AND created_at > NOW() - INTERVAL '24 hours')
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY & CREATE POLICIES
-- ============================================================================

-- Enable RLS on admin tables
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_analytics
CREATE POLICY listing_analytics_user_policy ON listing_analytics
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS(SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
    );

-- RLS Policies for admin_actions  
CREATE POLICY admin_actions_policy ON admin_actions
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
    );

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON listing_analytics TO authenticated;
GRANT INSERT ON listing_analytics TO authenticated;

-- Grant admin permissions
GRANT ALL ON admin_actions TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION calculate_engagement_score TO authenticated;
GRANT EXECUTE ON FUNCTION update_community_engagement_scores TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO authenticated;

-- ============================================================================
-- 9. INITIALIZE DATA
-- ============================================================================

-- Update algorithm_config with default HSC settings if it exists
UPDATE algorithm_config 
SET 
    weight_age = 0.6,
    weight_clicks = 0.4,
    settings = jsonb_build_object(
        'max_listings_per_page', 20,
        'engagement_decay_hours', 168,
        'click_tracking_enabled', true,
        'algorithm_version', '1.0'
    ),
    updated_at = NOW()
WHERE community_id = 'HSC';

-- Initialize engagement scores for existing listings
SELECT update_community_engagement_scores('HSC');

-- ============================================================================
-- 10. SUCCESS CONFIRMATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 ADMIN PANEL PHASE 2 MIGRATION COMPLETE!';
    RAISE NOTICE '✅ Communities table ready';
    RAISE NOTICE '✅ Listing analytics tracking enabled';
    RAISE NOTICE '✅ Admin actions logging enabled';
    RAISE NOTICE '✅ Engagement scoring functions created';
    RAISE NOTICE '✅ Admin dashboard functions ready';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '✅ HSC data initialized';
    RAISE NOTICE '📊 Your admin panel backend is now fully operational!';
END $$; 