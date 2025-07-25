-- ============================================================================
-- HSC ENHANCED MIGRATION: Multi-Site Foundation + Complete Admin Panel
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
-- 3. CREATE COMMUNITIES TABLE
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

-- Insert HSC as the first community
INSERT INTO communities (id, name, display_name, description, domain, subdomain, settings)
VALUES (
    'HSC',
    'hillsmere_shores',
    'Hillsmere Shores Classifieds',
    'Hyper-localized community marketplace for Hillsmere Shores, Maryland',
    'hsc.matakey.com',
    'hsc',
    '{"primary_color": "#10B981", "tagline": "Hyper localized community solutions"}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. ALGORITHM CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS algorithm_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id VARCHAR(50) REFERENCES communities(id) DEFAULT 'HSC',
    algorithm_name VARCHAR(100) NOT NULL DEFAULT 'engagement_score',
    weight_age DECIMAL(3,2) DEFAULT 0.60,
    weight_clicks DECIMAL(3,2) DEFAULT 0.40,
    weight_recency DECIMAL(3,2) DEFAULT 0.00,
    algorithm_enabled BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default algorithm config for HSC
INSERT INTO algorithm_config (community_id, algorithm_name, weight_age, weight_clicks, settings)
VALUES (
    'HSC',
    'engagement_score',
    0.60,
    0.40,
    '{"description": "User-defined algorithm: score = (1/(hours+1)) * 0.6 + (clicks/max_clicks) * 0.4"}'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ENHANCE LISTINGS TABLE FOR ENGAGEMENT
-- ============================================================================

-- Add engagement and analytics columns to listings
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(10,6) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS click_velocity DECIMAL(8,4) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS impression_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_viewers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- ============================================================================
-- 6. LISTING ANALYTICS TABLE (DETAILED TRACKING)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_listing_analytics_listing_id (listing_id),
    INDEX idx_listing_analytics_event_type (event_type),
    INDEX idx_listing_analytics_timestamp (event_timestamp),
    INDEX idx_listing_analytics_community (community_id)
);

-- ============================================================================
-- 7. ADMIN ACTIONS AUDIT TABLE
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_admin_actions_admin (admin_user_id),
    INDEX idx_admin_actions_community (community_id),
    INDEX idx_admin_actions_type (action_type),
    INDEX idx_admin_actions_timestamp (created_at)
);

-- ============================================================================
-- 8. CONTENT REPORTS TABLE
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_content_reports_listing (listing_id),
    INDEX idx_content_reports_status (status),
    INDEX idx_content_reports_community (community_id)
);

-- ============================================================================
-- 9. DATABASE FUNCTIONS FOR ENGAGEMENT SCORING
-- ============================================================================

-- Function to calculate engagement score using the user's algorithm
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    listing_created_at TIMESTAMP WITH TIME ZONE,
    listing_clicks INTEGER DEFAULT 0,
    max_clicks_in_community INTEGER DEFAULT 1
)
RETURNS DECIMAL(10,6) AS $$
DECLARE
    hours_since_posted DECIMAL;
    weight_age DECIMAL := 0.6;
    weight_clicks DECIMAL := 0.4;
    age_score DECIMAL;
    click_score DECIMAL;
    final_score DECIMAL;
BEGIN
    -- Calculate hours since posted
    hours_since_posted := EXTRACT(EPOCH FROM (NOW() - listing_created_at)) / 3600.0;
    
    -- Age component: 1 / (hours + 1) * weight_age
    age_score := (1.0 / (hours_since_posted + 1.0)) * weight_age;
    
    -- Click component: (clicks / max_clicks) * weight_clicks
    click_score := (listing_clicks::DECIMAL / GREATEST(max_clicks_in_community, 1)::DECIMAL) * weight_clicks;
    
    -- Final engagement score
    final_score := age_score + click_score;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update all engagement scores
CREATE OR REPLACE FUNCTION update_all_engagement_scores(target_community_id VARCHAR(50) DEFAULT 'HSC')
RETURNS INTEGER AS $$
DECLARE
    max_clicks INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Get max clicks for this community
    SELECT COALESCE(MAX(clicks), 1) INTO max_clicks
    FROM listings 
    WHERE community_id = target_community_id 
    AND status = 'active';
    
    -- Update all active listings in the community
    UPDATE listings 
    SET engagement_score = calculate_engagement_score(created_at, clicks, max_clicks)
    WHERE community_id = target_community_id 
    AND status = 'active';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function for admin dashboard metrics
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics(target_community_id VARCHAR(50) DEFAULT 'HSC')
RETURNS TABLE (
    total_listings INTEGER,
    total_clicks_today INTEGER,
    total_clicks_week INTEGER,
    active_users INTEGER,
    pending_reports INTEGER,
    revenue_today DECIMAL,
    new_signups_today INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM listings WHERE community_id = target_community_id AND status = 'active'),
        (SELECT COUNT(*)::INTEGER FROM listing_analytics WHERE community_id = target_community_id AND event_type = 'click' AND event_timestamp >= CURRENT_DATE),
        (SELECT COUNT(*)::INTEGER FROM listing_analytics WHERE community_id = target_community_id AND event_type = 'click' AND event_timestamp >= CURRENT_DATE - INTERVAL '7 days'),
        (SELECT COUNT(DISTINCT user_id)::INTEGER FROM listing_analytics WHERE community_id = target_community_id AND event_timestamp >= CURRENT_DATE - INTERVAL '1 day'),
        (SELECT COUNT(*)::INTEGER FROM content_reports WHERE community_id = target_community_id AND status = 'pending'),
        0.00::DECIMAL, -- Revenue calculation to be added later
        (SELECT COUNT(*)::INTEGER FROM users WHERE community_id = target_community_id AND created_at >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE algorithm_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Communities: Read access for authenticated users
CREATE POLICY communities_read_policy ON communities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Algorithm config: Admin only
CREATE POLICY algorithm_config_admin_policy ON algorithm_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- Listing analytics: Users can see their own data, admins can see all
CREATE POLICY listing_analytics_user_policy ON listing_analytics
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- Admin actions: Admin only
CREATE POLICY admin_actions_admin_policy ON admin_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- Content reports: Users can create/read their own, admins can see all
CREATE POLICY content_reports_user_policy ON content_reports
    FOR SELECT USING (
        reporter_user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY content_reports_create_policy ON content_reports
    FOR INSERT WITH CHECK (reporter_user_id = auth.uid());

-- ============================================================================
-- 11. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON algorithm_config TO authenticated;
GRANT SELECT, INSERT ON listing_analytics TO authenticated;
GRANT SELECT, INSERT ON admin_actions TO authenticated;
GRANT SELECT, INSERT ON content_reports TO authenticated;
GRANT SELECT ON communities TO authenticated;
GRANT UPDATE ON listings TO authenticated; -- For engagement_score updates

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_engagement_score TO authenticated;
GRANT EXECUTE ON FUNCTION update_all_engagement_scores TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO authenticated;

-- ============================================================================
-- 12. INITIAL DATA AND SETUP
-- ============================================================================

-- Update engagement scores for existing listings
SELECT update_all_engagement_scores('HSC');

-- Create initial admin action log entry
INSERT INTO admin_actions (
    admin_user_id,
    community_id,
    action_type,
    target_type,
    description,
    new_values
) VALUES (
    (SELECT id FROM users WHERE email = 'hugo_eilenberg@mac.com' LIMIT 1),
    'HSC',
    'system_setup',
    'system',
    'Enhanced admin panel and multi-site foundation migration completed',
    '{"migration": "enhanced-community-admin", "version": "1.0", "features": ["multi_site_foundation", "algorithm_controls", "click_tracking", "admin_panel"]}'
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add helpful comments
COMMENT ON TABLE communities IS 'Multi-site community configuration';
COMMENT ON TABLE algorithm_config IS 'Algorithm weight configuration per community';
COMMENT ON TABLE listing_analytics IS 'Detailed user interaction tracking';
COMMENT ON TABLE admin_actions IS 'Admin activity audit log';
COMMENT ON TABLE content_reports IS 'Community content moderation reports';
COMMENT ON FUNCTION calculate_engagement_score IS 'User-defined algorithm: score = (1/(hours+1)) * 0.6 + (clicks/max_clicks) * 0.4';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 MIGRATION COMPLETE: Enhanced HSC Admin Panel + Multi-Site Foundation';
    RAISE NOTICE '✅ Community support added (all data tagged as HSC)';
    RAISE NOTICE '✅ Algorithm controls ready';
    RAISE NOTICE '✅ Click tracking system ready';
    RAISE NOTICE '✅ Admin audit logging enabled';
    RAISE NOTICE '✅ Content moderation system ready';
    RAISE NOTICE '🚀 Ready to implement algorithm controls and click tracking!';
END $$; 