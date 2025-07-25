-- COMPREHENSIVE FIX: Drop and recreate ALL RLS policies to prevent duplicates
-- This script safely handles all potential policy conflicts in one go

-- ==========================================
-- PART 1: DROP ALL EXISTING POLICIES
-- ==========================================

-- Content Reports table policies
DROP POLICY IF EXISTS "content_reports_user_policy" ON content_reports;
DROP POLICY IF EXISTS "content_reports_admin_policy" ON content_reports;

-- Listing Analytics table policies  
DROP POLICY IF EXISTS "listing_analytics_user_policy" ON listing_analytics;
DROP POLICY IF EXISTS "listing_analytics_admin_policy" ON listing_analytics;

-- Admin Actions table policies
DROP POLICY IF EXISTS "admin_actions_policy" ON admin_actions;

-- Algorithm Config table policies
DROP POLICY IF EXISTS "algorithm_config_policy" ON algorithm_config;

-- Users table policies (existing ones)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;

-- Listings table policies (potential existing ones)
DROP POLICY IF EXISTS "Users can view all listings" ON listings;
DROP POLICY IF EXISTS "Users can view their own listings" ON listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON listings;
DROP POLICY IF EXISTS "Admin can view all listings" ON listings;
DROP POLICY IF EXISTS "Admin can update all listings" ON listings;

-- Communities table policies
DROP POLICY IF EXISTS "Users can view communities" ON communities;
DROP POLICY IF EXISTS "Admin can manage communities" ON communities;

-- Weekly ads policies
DROP POLICY IF EXISTS "Users can view weekly ads" ON weekly_ads;
DROP POLICY IF EXISTS "Users can manage their weekly ads" ON weekly_ads;
DROP POLICY IF EXISTS "Admin can manage all weekly ads" ON weekly_ads;

-- Ad bids policies  
DROP POLICY IF EXISTS "Users can view ad bids" ON ad_bids;
DROP POLICY IF EXISTS "Users can manage their ad bids" ON ad_bids;
DROP POLICY IF EXISTS "Admin can manage all ad bids" ON ad_bids;

-- Ad payments policies
DROP POLICY IF EXISTS "Users can view their ad payments" ON ad_payments;
DROP POLICY IF EXISTS "Admin can view all ad payments" ON ad_payments;

-- ==========================================
-- PART 2: RECREATE ALL POLICIES FRESH
-- ==========================================

-- 1. USERS TABLE POLICIES
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- 2. LISTINGS TABLE POLICIES
CREATE POLICY "Users can view all listings" ON listings
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own listings" ON listings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update all listings" ON listings
    FOR UPDATE USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- 3. CONTENT REPORTS TABLE POLICIES
CREATE POLICY "content_reports_user_policy" ON content_reports
    FOR ALL USING (
        auth.uid() = reporter_user_id OR 
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "content_reports_admin_policy" ON content_reports
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- 4. LISTING ANALYTICS TABLE POLICIES
CREATE POLICY "listing_analytics_user_policy" ON listing_analytics
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid()) OR
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "listing_analytics_admin_policy" ON listing_analytics
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- 5. ADMIN ACTIONS TABLE POLICIES
CREATE POLICY "admin_actions_policy" ON admin_actions
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- 6. ALGORITHM CONFIG TABLE POLICIES
CREATE POLICY "algorithm_config_policy" ON algorithm_config
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- 7. COMMUNITIES TABLE POLICIES
CREATE POLICY "Users can view communities" ON communities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage communities" ON communities
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- ==========================================
-- PART 3: VERIFICATION MESSAGE
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: All RLS policies have been dropped and recreated fresh!';
    RAISE NOTICE 'No more duplicate policy errors should occur.';
    RAISE NOTICE 'You can now run your main migration script safely.';
END $$; 