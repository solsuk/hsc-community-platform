-- ============================================================================
-- DATABASE STATE INSPECTION QUERIES
-- Run these in Supabase SQL Editor to check current database state
-- ============================================================================

-- 1. CHECK EXISTING TABLES
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. CHECK COLUMNS IN EXISTING TABLES
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('users', 'listings', 'weekly_ads', 'ad_bids', 'ad_payments', 'communities', 'algorithm_config', 'listing_analytics', 'admin_actions', 'content_reports')
ORDER BY table_name, ordinal_position;

-- 3. CHECK EXISTING POLICIES (RLS)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. CHECK EXISTING TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. CHECK EXISTING FUNCTIONS
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%engagement%' 
   OR routine_name LIKE '%calculate%'
   OR routine_name LIKE '%admin%'
ORDER BY routine_name;

-- 6. CHECK EXISTING INDEXES
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (indexname LIKE '%analytics%' 
     OR indexname LIKE '%admin%' 
     OR indexname LIKE '%community%'
     OR indexname LIKE '%reports%')
ORDER BY tablename, indexname;

-- 7. CHECK SPECIFIC COMMUNITY_ID COLUMNS
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND column_name = 'community_id'
ORDER BY table_name;

-- 8. CHECK ALGORITHM_CONFIG TABLE STRUCTURE (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'algorithm_config'
ORDER BY ordinal_position;

-- 9. CHECK FOR PROBLEMATIC AD_BIDS TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'ad_bids'
ORDER BY trigger_name;

-- 10. CHECK EXISTING DATA COUNTS
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
    'listings' as table_name, COUNT(*) as row_count FROM listings
UNION ALL
SELECT 
    'communities' as table_name, 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communities' AND table_schema = 'public')
         THEN (SELECT COUNT(*)::text FROM communities)::int
         ELSE 0
    END as row_count
UNION ALL
SELECT 
    'algorithm_config' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'algorithm_config' AND table_schema = 'public')
         THEN (SELECT COUNT(*)::text FROM algorithm_config)::int
         ELSE 0
    END as row_count;

-- ============================================================================
-- SUMMARY QUERY: MIGRATION READINESS CHECK
-- ============================================================================

SELECT 
    'MIGRATION READINESS REPORT' as report_type,
    NOW() as checked_at,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'community_id') as tables_with_community_id,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as total_triggers; 