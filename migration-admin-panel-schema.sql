-- ============================================================================
-- HSC Admin Panel Database Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ALGORITHM CONFIGURATION TABLE
-- ============================================================================
-- Stores algorithm settings and allows for different configurations
CREATE TABLE IF NOT EXISTS algorithm_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_name VARCHAR(100) NOT NULL DEFAULT 'default',
    
    -- Core algorithm weights
    age_weight DECIMAL(3,2) NOT NULL DEFAULT 0.6,
    clicks_weight DECIMAL(3,2) NOT NULL DEFAULT 0.4,
    
    -- Advanced parameters (JSON for flexibility)
    type_weights JSONB DEFAULT '{
        "announce": {"age": 0.8, "clicks": 0.2},
        "sell": {"age": 0.5, "clicks": 0.5},
        "trade": {"age": 0.4, "clicks": 0.6},
        "wanted": {"age": 0.6, "clicks": 0.4}
    }',
    
    category_boosts JSONB DEFAULT '{}',
    
    -- System controls
    algorithm_enabled BOOLEAN DEFAULT TRUE,
    max_clicks_cap INTEGER DEFAULT NULL,
    decay_rate DECIMAL(5,3) DEFAULT 1.0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_weights CHECK (age_weight >= 0 AND age_weight <= 1 AND clicks_weight >= 0 AND clicks_weight <= 1),
    CONSTRAINT weight_sum_check CHECK (ABS(age_weight + clicks_weight - 1.0) < 0.01)
);

-- Only one active configuration at a time
CREATE UNIQUE INDEX idx_algorithm_config_active ON algorithm_config (is_active) WHERE is_active = TRUE;

-- Insert default configuration
INSERT INTO algorithm_config (config_name, is_active, created_by)
VALUES ('default', TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. LISTING ANALYTICS TABLE
-- ============================================================================
-- Tracks all user interactions with listings for analytics
CREATE TABLE IF NOT EXISTS listing_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'click', 'contact', 'share', 'impression')),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User context (optional for anonymous tracking)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Technical details
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    
    -- Device/location data
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    browser_name VARCHAR(100),
    
    -- Engagement context
    time_on_listing INTEGER, -- seconds spent viewing
    scroll_depth INTEGER,    -- percentage scrolled in modal
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_id ON listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON listing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_timestamp ON listing_analytics(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_user_id ON listing_analytics(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- 3. ADMIN ACTIONS AUDIT LOG
-- ============================================================================
-- Logs all admin actions for security and accountability
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Action details
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- 'user', 'listing', 'algorithm', 'system', etc.
    target_id UUID,
    
    -- Action context
    details JSONB,
    old_values JSONB,
    new_values JSONB,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    
    -- Results
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(created_at DESC);

-- ============================================================================
-- 4. CONTENT REPORTS TABLE
-- ============================================================================
-- Handles community reports about problematic content
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Reporter information
    reporter_email VARCHAR(255),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Report details
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'scam', 'duplicate', 'offensive', 'other')),
    description TEXT,
    category VARCHAR(100),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Resolution
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for content reports
CREATE INDEX IF NOT EXISTS idx_content_reports_listing_id ON content_reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_timestamp ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_priority ON content_reports(priority, status);

-- ============================================================================
-- 5. ENHANCED LISTINGS TABLE UPDATES
-- ============================================================================
-- Add new columns to existing listings table for admin panel features

-- Add engagement tracking columns
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS click_velocity DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS impression_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_viewers INTEGER DEFAULT 0;

-- Add admin flags
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS admin_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Create index for engagement sorting
CREATE INDEX IF NOT EXISTS idx_listings_engagement_score ON listings(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_admin_flags ON listings(admin_featured, admin_hidden);

-- ============================================================================
-- 6. DATABASE FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function to calculate engagement score for a listing
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    listing_clicks INTEGER,
    listing_impressions INTEGER,
    hours_since_created INTEGER,
    unique_viewers INTEGER DEFAULT 1
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    ctr DECIMAL(5,4);
    age_factor DECIMAL(5,4);
    diversity_factor DECIMAL(5,4);
    base_score DECIMAL(10,2);
BEGIN
    -- Calculate click-through rate
    ctr := CASE 
        WHEN listing_impressions > 0 THEN listing_clicks::DECIMAL / listing_impressions::DECIMAL
        ELSE 0 
    END;
    
    -- Age decay factor (48-day half-life)
    age_factor := EXP(-hours_since_created::DECIMAL / (48.0 * 24.0));
    
    -- User diversity bonus
    diversity_factor := LEAST(unique_viewers::DECIMAL / 10.0, 2.0);
    
    -- Calculate base score
    base_score := (ctr * 100.0 + listing_clicks::DECIMAL) * age_factor * diversity_factor;
    
    RETURN ROUND(base_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update engagement scores (run periodically)
CREATE OR REPLACE FUNCTION update_all_engagement_scores() RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    listing_record RECORD;
BEGIN
    FOR listing_record IN 
        SELECT id, clicks, impression_count, unique_viewers, created_at
        FROM listings 
        WHERE status = 'active'
    LOOP
        UPDATE listings 
        SET engagement_score = calculate_engagement_score(
            listing_record.clicks,
            COALESCE(listing_record.impression_count, 0),
            EXTRACT(EPOCH FROM (NOW() - listing_record.created_at)) / 3600,
            COALESCE(listing_record.unique_viewers, 1)
        )
        WHERE id = listing_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin dashboard metrics
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_listings', (SELECT COUNT(*) FROM listings WHERE status = 'active'),
        'total_clicks_today', (
            SELECT COALESCE(SUM(clicks), 0) 
            FROM listings 
            WHERE last_clicked_at >= CURRENT_DATE
        ),
        'total_clicks_week', (
            SELECT COUNT(*) 
            FROM listing_analytics 
            WHERE event_type = 'click' 
            AND event_timestamp >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'active_users', (
            SELECT COUNT(DISTINCT user_id) 
            FROM listing_analytics 
            WHERE event_timestamp >= CURRENT_DATE - INTERVAL '24 hours'
            AND user_id IS NOT NULL
        ),
        'pending_reports', (
            SELECT COUNT(*) 
            FROM content_reports 
            WHERE status = 'pending'
        ),
        'algorithm_status', (
            SELECT CASE WHEN algorithm_enabled THEN 'active' ELSE 'disabled' END
            FROM algorithm_config 
            WHERE is_active = TRUE 
            LIMIT 1
        ),
        'new_signups_today', (
            SELECT COUNT(*) 
            FROM users 
            WHERE created_at >= CURRENT_DATE
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Algorithm config - Admin only
ALTER TABLE algorithm_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access to algorithm config" ON algorithm_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

-- Listing analytics - Admin only for full access, users can see their own
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to analytics" ON listing_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

CREATE POLICY "Users can view their own analytics" ON listing_analytics
    FOR SELECT USING (
        user_id::text = auth.uid()::text
    );

-- Admin actions - Admin only
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access to admin actions" ON admin_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

-- Content reports - Public can create, admin can manage
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create reports" ON content_reports
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin can manage all reports" ON content_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (
        reporter_id::text = auth.uid()::text
    );

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to admin tables
GRANT ALL ON algorithm_config TO authenticated;
GRANT ALL ON listing_analytics TO authenticated;
GRANT ALL ON admin_actions TO authenticated;  
GRANT ALL ON content_reports TO authenticated;

-- Grant access to functions
GRANT EXECUTE ON FUNCTION calculate_engagement_score TO authenticated;
GRANT EXECUTE ON FUNCTION update_all_engagement_scores TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO authenticated;

-- ============================================================================
-- 9. INITIAL DATA SETUP
-- ============================================================================

-- Create sample admin action for testing
INSERT INTO admin_actions (admin_id, action_type, target_type, details)
SELECT id, 'system_setup', 'database', '{"message": "Admin panel schema initialized"}'
FROM users 
WHERE is_admin = TRUE 
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE algorithm_config IS 'Stores algorithm configuration settings for the listing ranking system';
COMMENT ON TABLE listing_analytics IS 'Tracks all user interactions with listings for analytics and engagement scoring';
COMMENT ON TABLE admin_actions IS 'Audit log of all administrative actions performed in the system';
COMMENT ON TABLE content_reports IS 'Community reports about problematic listings or content';

COMMENT ON FUNCTION calculate_engagement_score IS 'Calculates engagement score based on clicks, impressions, age, and user diversity';
COMMENT ON FUNCTION update_all_engagement_scores IS 'Batch updates engagement scores for all active listings';
COMMENT ON FUNCTION get_admin_dashboard_metrics IS 'Returns key metrics for the admin dashboard in JSON format';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration
SELECT 
    'algorithm_config' as table_name, COUNT(*) as row_count 
FROM algorithm_config
UNION ALL
SELECT 
    'listing_analytics' as table_name, COUNT(*) as row_count 
FROM listing_analytics
UNION ALL
SELECT 
    'admin_actions' as table_name, COUNT(*) as row_count 
FROM admin_actions
UNION ALL
SELECT 
    'content_reports' as table_name, COUNT(*) as row_count 
FROM content_reports;

-- Show active algorithm config
SELECT config_name, age_weight, clicks_weight, algorithm_enabled, is_active 
FROM algorithm_config 
WHERE is_active = TRUE; 