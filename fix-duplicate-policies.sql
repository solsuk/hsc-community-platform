-- Fix for duplicate RLS policy errors
-- The issue: Policies already exist from previous migration attempts

-- Drop existing policies if they exist (no error if they don't exist)
DROP POLICY IF EXISTS content_reports_user_policy ON content_reports;
DROP POLICY IF EXISTS content_reports_admin_policy ON content_reports;
DROP POLICY IF EXISTS listing_analytics_user_policy ON listing_analytics;
DROP POLICY IF EXISTS listing_analytics_admin_policy ON listing_analytics;
DROP POLICY IF EXISTS admin_actions_policy ON admin_actions;
DROP POLICY IF EXISTS algorithm_config_policy ON algorithm_config;

-- Recreate all policies fresh
-- Content Reports Policies
CREATE POLICY content_reports_user_policy ON content_reports
    FOR ALL USING (
        auth.uid() = reporter_user_id OR 
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY content_reports_admin_policy ON content_reports
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Listing Analytics Policies  
CREATE POLICY listing_analytics_user_policy ON listing_analytics
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid()) OR
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY listing_analytics_admin_policy ON listing_analytics
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Admin Actions Policy
CREATE POLICY admin_actions_policy ON admin_actions
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Algorithm Config Policy
CREATE POLICY algorithm_config_policy ON algorithm_config
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Note: This script safely drops and recreates all RLS policies
-- to avoid "policy already exists" errors from repeated migrations 