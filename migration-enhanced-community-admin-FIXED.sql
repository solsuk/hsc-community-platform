-- ============================================================================
-- HSC ENHANCED MIGRATION: Multi-Site Foundation + Complete Admin Panel
-- FIXED VERSION - IDEMPOTENT & CONFLICT-FREE
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ADD COMMUNITY SUPPORT TO EXISTING TABLES (ADD COLUMNS FIRST)
-- ============================================================================

-- Add community_id to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC',
ADD COLUMN IF NOT EXISTS primary_community_id VARCHAR(50) DEFAULT 'HSC';

-- Add community_id to listings table  
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';

-- Add community support to other existing tables
ALTER TABLE weekly_ads 
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';

ALTER TABLE ad_bids 
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';

ALTER TABLE ad_payments 
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';

-- ============================================================================
-- 2. UPDATE EXISTING DATA WITH HSC COMMUNITY ID
-- ============================================================================

-- Tag all existing users as HSC community
UPDATE users 
SET community_id = 'HSC', primary_community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

-- Tag all existing listings as HSC community
UPDATE listings 
SET community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

-- Tag existing ads as HSC community
UPDATE weekly_ads 
SET community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

UPDATE ad_bids 
SET community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

UPDATE ad_payments 
SET community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

-- ============================================================================
-- 3. ADD ENGAGEMENT COLUMNS TO LISTINGS
-- ============================================================================

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(10,6) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 4. COMMUNITIES TABLE (Multi-Site Foundation)
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

-- ============================================================================
-- 5. ALGORITHM CONFIG TABLE
-- ============================================================================

-- Ensure algorithm_config table exists with correct structure
DROP TABLE IF EXISTS algorithm_config CASCADE;
CREATE TABLE algorithm_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id VARCHAR(50) REFERENCES communities(id) DEFAULT 'HSC',
    algorithm_name VARCHAR(100) NOT NULL DEFAULT 'engagement_ranking',
    weight_age DECIMAL(3,2) DEFAULT 0.60,
    weight_clicks DECIMAL(3,2) DEFAULT 0.40,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. LISTING ANALYTICS TABLE (FIXED - NO INLINE INDEX)
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    community_id VARCHAR(50) REFERENCES communities(id) DEFAULT 'HSC',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL, -- 'view', 'click', 'contact', 'share', 'impression'
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    session_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes separately (FIXED)
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_id ON listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON listing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_timestamp ON listing_analytics(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_community ON listing_analytics(community_id);

-- ============================================================================
-- 7. ADMIN ACTIONS AUDIT TABLE (FIXED - NO INLINE INDEX)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES users(id),
    community_id VARCHAR(50) REFERENCES communities(id) DEFAULT 'HSC',
    action_type VARCHAR(50) NOT NULL, -- 'algorithm_update', 'content_moderate', 'user_manage'
    target_type VARCHAR(50), -- 'listing', 'user', 'algorithm', 'system'
    target_id UUID,
    description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes separately (FIXED)
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_community ON admin_actions(community_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(created_at);

-- ============================================================================
-- 8. CONTENT REPORTS TABLE (FIXED - NO INLINE INDEX)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    community_id VARCHAR(50) REFERENCES communities(id) DEFAULT 'HSC',
    reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL, -- 'spam', 'inappropriate', 'fraud', 'other'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes separately (FIXED)
CREATE INDEX IF NOT EXISTS idx_content_reports_listing ON content_reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_community ON content_reports(community_id);

-- ============================================================================
-- 9. ENGAGEMENT SCORE CALCULATION FUNCTIONS
-- ============================================================================

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
    -- Calculate hours since posting
    hours_since_posted := EXTRACT(EPOCH FROM (NOW() - listing_created_at)) / 3600.0;
    
    -- Age score: newer posts score higher (1/(hours+1)) * weight
    age_score := (1.0 / (hours_since_posted + 1.0)) * weight_age;
    
    -- Click score: normalize clicks against community max * weight  
    click_score := (listing_clicks::DECIMAL / GREATEST(max_clicks_in_community, 1)::DECIMAL) * weight_clicks;
    
    -- Final engagement score
    final_score := age_score + click_score;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk update engagement scores
CREATE OR REPLACE FUNCTION update_all_engagement_scores(community_filter VARCHAR(50) DEFAULT 'HSC') 
RETURNS INTEGER AS $$
DECLARE
    max_clicks INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Get max clicks in community for normalization
    SELECT COALESCE(MAX(click_count), 1) INTO max_clicks 
    FROM listings 
    WHERE community_id = community_filter;
    
    -- Update all listings with fresh engagement scores
    UPDATE listings 
    SET engagement_score = calculate_engagement_score(
        created_at, 
        click_count, 
        max_clicks
    )
    WHERE community_id = community_filter;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Admin dashboard metrics function
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics(community_filter VARCHAR(50) DEFAULT 'HSC')
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_listings', (SELECT COUNT(*) FROM listings WHERE community_id = community_filter),
        'active_listings', (SELECT COUNT(*) FROM listings WHERE community_id = community_filter AND status = 'active'),
        'total_users', (SELECT COUNT(*) FROM users WHERE community_id = community_filter),
        'admin_users', (SELECT COUNT(*) FROM users WHERE community_id = community_filter AND is_admin = true),
        'total_clicks', (SELECT COALESCE(SUM(click_count), 0) FROM listings WHERE community_id = community_filter),
        'avg_engagement', (SELECT ROUND(AVG(engagement_score), 4) FROM listings WHERE community_id = community_filter),
        'pending_reports', (SELECT COUNT(*) FROM content_reports WHERE community_id = community_filter AND status = 'pending'),
        'recent_actions', (SELECT COUNT(*) FROM admin_actions WHERE community_id = community_filter AND created_at > NOW() - INTERVAL '24 hours')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. RLS POLICIES (FIXED - WITH IF NOT EXISTS PATTERNS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_config ENABLE ROW LEVEL SECURITY;  
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe operation)
DROP POLICY IF EXISTS communities_read_policy ON communities;
DROP POLICY IF EXISTS algorithm_config_admin_policy ON algorithm_config;
DROP POLICY IF EXISTS listing_analytics_user_policy ON listing_analytics;
DROP POLICY IF EXISTS listing_analytics_admin_policy ON listing_analytics;
DROP POLICY IF EXISTS admin_actions_admin_policy ON admin_actions;
DROP POLICY IF EXISTS content_reports_user_policy ON content_reports;
DROP POLICY IF EXISTS content_reports_create_policy ON content_reports;

-- Recreate policies fresh
CREATE POLICY communities_read_policy ON communities
    FOR SELECT USING (true); -- All communities visible for multi-site browsing

CREATE POLICY algorithm_config_admin_policy ON algorithm_config
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY listing_analytics_user_policy ON listing_analytics
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY listing_analytics_admin_policy ON listing_analytics
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY admin_actions_admin_policy ON admin_actions
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY content_reports_user_policy ON content_reports
    FOR ALL USING (
        reporter_user_id = auth.uid() OR 
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY content_reports_create_policy ON content_reports
    FOR INSERT WITH CHECK (
        reporter_user_id = auth.uid()
    );

-- ============================================================================
-- 11. GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated role
GRANT ALL ON communities TO authenticated;
GRANT ALL ON algorithm_config TO authenticated;
GRANT ALL ON listing_analytics TO authenticated;
GRANT ALL ON admin_actions TO authenticated;  
GRANT ALL ON content_reports TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 12. INSERT INITIAL DATA
-- ============================================================================

-- Insert HSC community if it doesn't exist
INSERT INTO communities (id, name, display_name, description, domain, subdomain, settings)
VALUES (
    'HSC',
    'hillsmere_shores',
    'Hillsmere Shores Classifieds',
    'Hyper-localized community marketplace for Hillsmere Shores, Maryland',
    'localhost:3000',
    'hsc',
    '{"theme": "green", "features": ["listings", "payments", "chat"], "max_listings_per_user": 50}'
)
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW(),
    settings = EXCLUDED.settings;

-- Insert default algorithm configuration for HSC
INSERT INTO algorithm_config (community_id, algorithm_name, weight_age, weight_clicks, settings)
VALUES (
    'HSC',
    'engagement_ranking',
    0.60,
    0.40,
    '{"auto_update": true, "update_frequency": "hourly", "max_score": 1.0}'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. SUCCESS CONFIRMATION
-- ============================================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE '✅ HSC Enhanced Migration Completed Successfully!';
    RAISE NOTICE '🚀 Multi-site foundation ready with HSC community';
    RAISE NOTICE '📊 Admin panel backend fully configured';
    RAISE NOTICE '🎯 Algorithm controls and analytics enabled';
    RAISE NOTICE '🔒 RLS policies and permissions configured';
    RAISE NOTICE '📈 Ready for admin panel frontend development';
END $$;

-- Final verification query
SELECT 
    'MIGRATION SUCCESS' as status,
    COUNT(*) as hsc_listings,
    (SELECT COUNT(*) FROM users WHERE community_id = 'HSC') as hsc_users,
    (SELECT COUNT(*) FROM communities) as total_communities,
    NOW() as completed_at
FROM listings 
WHERE community_id = 'HSC'; 