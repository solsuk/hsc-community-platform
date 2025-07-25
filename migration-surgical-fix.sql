-- ============================================================================
-- SURGICAL DATABASE MIGRATION - BASED ON ACTUAL DATABASE STATE
-- Fixes only what's missing/broken, avoids all conflicts
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. FIX THE TRIGGER RECURSION ISSUE (CRITICAL)
-- ============================================================================

-- Drop the problematic trigger that causes infinite recursion
DROP TRIGGER IF EXISTS ad_bids_position_trigger ON ad_bids;

-- Recreate trigger that only fires on relevant column changes (NOT on current_position updates)
CREATE TRIGGER ad_bids_position_trigger
  AFTER INSERT OR DELETE OR UPDATE OF weekly_bid_amount, status, week_start, week_end ON ad_bids
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_positions();

-- ============================================================================
-- 2. ADD MISSING COMMUNITY_ID COLUMNS (5 TABLES NEED IT)
-- ============================================================================

-- Add community_id to users table (MISSING)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC',
ADD COLUMN IF NOT EXISTS primary_community_id VARCHAR(50) DEFAULT 'HSC';

-- Add community_id to listings table (MISSING)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';

-- Add community_id to weekly_ads table (MISSING)
ALTER TABLE weekly_ads 
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';

-- Add community_id to ad_bids table (MISSING)
ALTER TABLE ad_bids 
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';

-- Add community_id to ad_payments table (MISSING)
ALTER TABLE ad_payments 
ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';

-- ============================================================================
-- 3. UPDATE EXISTING DATA WITH HSC COMMUNITY ID
-- ============================================================================

-- Tag all existing users as HSC community
UPDATE users 
SET community_id = 'HSC', primary_community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

-- Tag all existing listings as HSC community
UPDATE listings 
SET community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

-- Tag existing weekly_ads as HSC community
UPDATE weekly_ads 
SET community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

-- Tag existing ad_bids as HSC community
UPDATE ad_bids 
SET community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

-- Tag existing ad_payments as HSC community
UPDATE ad_payments 
SET community_id = 'HSC' 
WHERE community_id IS NULL OR community_id = '';

-- ============================================================================
-- 4. ADD ENGAGEMENT COLUMNS TO LISTINGS (if not exist)
-- ============================================================================

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(10,6) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 5. CREATE MISSING TABLES (ONLY IF THEY DON'T EXIST)
-- ============================================================================

-- Communities table (foundation for multi-site)
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

-- Listing Analytics table (admin panel backend)
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

-- Admin Actions audit table (admin panel backend)
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

-- ============================================================================
-- 6. CREATE INDEXES (ONLY IF THEY DON'T EXIST)
-- ============================================================================

-- Listing Analytics indexes
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_id ON listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON listing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_timestamp ON listing_analytics(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_community ON listing_analytics(community_id);

-- Admin Actions indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_community ON admin_actions(community_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(created_at);

-- ============================================================================
-- 7. ENGAGEMENT SCORE FUNCTIONS (CREATE OR REPLACE - SAFE)
-- ============================================================================

-- Function to calculate engagement scores
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
    
    -- Age score: newer posts score higher
    age_score := (1.0 / (hours_since_posted + 1.0)) * weight_age;
    
    -- Click score: normalize clicks against community max
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
        'recent_actions', (SELECT COUNT(*) FROM admin_actions WHERE community_id = community_filter AND created_at > NOW() - INTERVAL '24 hours')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. ENABLE RLS ON NEW TABLES (IF NOT ALREADY ENABLED)
-- ============================================================================

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Only enable RLS on existing tables if they don't already have policies
DO $$
BEGIN
    -- Check if algorithm_config table exists and enable RLS if needed
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'algorithm_config' AND table_schema = 'public') THEN
        ALTER TABLE algorithm_config ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Check if content_reports table exists and enable RLS if needed  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_reports' AND table_schema = 'public') THEN
        ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================================
-- 9. CREATE MINIMAL ESSENTIAL POLICIES (AVOID CONFLICTS)
-- ============================================================================

-- Communities policies (safe - new table)
DROP POLICY IF EXISTS communities_read_policy ON communities;
CREATE POLICY communities_read_policy ON communities
    FOR SELECT USING (true); -- All communities visible for multi-site browsing

-- Listing Analytics policies (safe - new table)
DROP POLICY IF EXISTS listing_analytics_admin_policy ON listing_analytics;
CREATE POLICY listing_analytics_admin_policy ON listing_analytics
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Admin Actions policies (safe - new table)
DROP POLICY IF EXISTS admin_actions_admin_policy ON admin_actions;
CREATE POLICY admin_actions_admin_policy ON admin_actions
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated role
GRANT ALL ON communities TO authenticated;
GRANT ALL ON listing_analytics TO authenticated;
GRANT ALL ON admin_actions TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 11. INSERT INITIAL DATA (SAFE WITH CONFLICT HANDLING)
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

-- ============================================================================
-- 12. SUCCESS CONFIRMATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ SURGICAL MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '🔧 Fixed trigger recursion issue (ad_bids infinite loop)';
    RAISE NOTICE '📊 Added community_id to 5 missing tables';
    RAISE NOTICE '🏗️ Created missing admin panel tables';
    RAISE NOTICE '📈 Added engagement scoring functions';
    RAISE NOTICE '🔒 Configured essential policies';
    RAISE NOTICE '🎯 Ready for admin panel development!';
END $$;

-- Final verification query
SELECT 
    'SURGICAL MIGRATION SUCCESS' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'community_id') as tables_with_community_id,
    (SELECT COUNT(*) FROM listings WHERE community_id = 'HSC') as hsc_listings,
    (SELECT COUNT(*) FROM users WHERE community_id = 'HSC') as hsc_users,
    NOW() as completed_at; 