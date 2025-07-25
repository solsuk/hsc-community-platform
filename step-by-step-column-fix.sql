-- ============================================================================
-- STEP-BY-STEP COMMUNITY_ID COLUMN ADDITION
-- Add columns one table at a time with diagnostic messages
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CHECK WHICH TABLES EXIST
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'listings', 'weekly_ads', 'ad_bids', 'ad_payments');
    
    RAISE NOTICE '✓ Found % target tables', table_count;
    
    -- List the tables that exist
    FOR table_count IN 
        SELECT table_name::TEXT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'listings', 'weekly_ads', 'ad_bids', 'ad_payments')
        ORDER BY table_name
    LOOP
        RAISE NOTICE '  - Table exists: %', table_count;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: ADD COMMUNITY_ID TO USERS TABLE
-- ============================================================================

DO $$
BEGIN
    -- Check if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE NOTICE '📋 Adding community_id to users table...';
        
        -- Add columns
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC',
        ADD COLUMN IF NOT EXISTS primary_community_id VARCHAR(50) DEFAULT 'HSC';
        
        RAISE NOTICE '✅ Successfully added community_id to users table';
    ELSE
        RAISE NOTICE '⚠️  Users table does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding community_id to users: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 3: ADD COMMUNITY_ID TO LISTINGS TABLE
-- ============================================================================

DO $$
BEGIN
    -- Check if listings table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
        RAISE NOTICE '📋 Adding community_id to listings table...';
        
        -- Add column
        ALTER TABLE listings 
        ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';
        
        RAISE NOTICE '✅ Successfully added community_id to listings table';
    ELSE
        RAISE NOTICE '⚠️  Listings table does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding community_id to listings: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 4: ADD COMMUNITY_ID TO WEEKLY_ADS TABLE
-- ============================================================================

DO $$
BEGIN
    -- Check if weekly_ads table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weekly_ads') THEN
        RAISE NOTICE '📋 Adding community_id to weekly_ads table...';
        
        -- Add column
        ALTER TABLE weekly_ads 
        ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';
        
        RAISE NOTICE '✅ Successfully added community_id to weekly_ads table';
    ELSE
        RAISE NOTICE '⚠️  Weekly_ads table does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding community_id to weekly_ads: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 5: ADD COMMUNITY_ID TO AD_BIDS TABLE
-- ============================================================================

DO $$
BEGIN
    -- Check if ad_bids table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_bids') THEN
        RAISE NOTICE '📋 Adding community_id to ad_bids table...';
        
        -- Add column
        ALTER TABLE ad_bids 
        ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';
        
        RAISE NOTICE '✅ Successfully added community_id to ad_bids table';
    ELSE
        RAISE NOTICE '⚠️  Ad_bids table does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding community_id to ad_bids: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 6: ADD COMMUNITY_ID TO AD_PAYMENTS TABLE
-- ============================================================================

DO $$
BEGIN
    -- Check if ad_payments table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_payments') THEN
        RAISE NOTICE '📋 Adding community_id to ad_payments table...';
        
        -- Add column
        ALTER TABLE ad_payments 
        ADD COLUMN IF NOT EXISTS community_id VARCHAR(50) DEFAULT 'HSC';
        
        RAISE NOTICE '✅ Successfully added community_id to ad_payments table';
    ELSE
        RAISE NOTICE '⚠️  Ad_payments table does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding community_id to ad_payments: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 7: UPDATE EXISTING DATA WITH HSC COMMUNITY ID
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📋 Updating existing data with HSC community ID...';
    
    -- Update users data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'community_id') THEN
        UPDATE users 
        SET community_id = 'HSC', primary_community_id = 'HSC'
        WHERE community_id IS NULL OR community_id = '';
        RAISE NOTICE '✅ Updated users table data';
    END IF;
    
    -- Update listings data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'community_id') THEN
        UPDATE listings 
        SET community_id = 'HSC'
        WHERE community_id IS NULL OR community_id = '';
        RAISE NOTICE '✅ Updated listings table data';
    END IF;
    
    -- Update weekly_ads data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'weekly_ads' AND column_name = 'community_id') THEN
        UPDATE weekly_ads 
        SET community_id = 'HSC'
        WHERE community_id IS NULL OR community_id = '';
        RAISE NOTICE '✅ Updated weekly_ads table data';
    END IF;
    
    -- Update ad_bids data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ad_bids' AND column_name = 'community_id') THEN
        UPDATE ad_bids 
        SET community_id = 'HSC'
        WHERE community_id IS NULL OR community_id = '';
        RAISE NOTICE '✅ Updated ad_bids table data';
    END IF;
    
    -- Update ad_payments data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ad_payments' AND column_name = 'community_id') THEN
        UPDATE ad_payments 
        SET community_id = 'HSC'
        WHERE community_id IS NULL OR community_id = '';
        RAISE NOTICE '✅ Updated ad_payments table data';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error updating data: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 8: FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name = 'community_id';
    
    RAISE NOTICE '🎉 STEP-BY-STEP MIGRATION COMPLETE!';
    RAISE NOTICE '📊 Total tables now have community_id column: %', column_count;
    
    -- Show which tables have the column
    FOR column_count IN 
        SELECT table_name::TEXT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'community_id'
        ORDER BY table_name
    LOOP
        RAISE NOTICE '  ✅ %', column_count;
    END LOOP;
END $$; 