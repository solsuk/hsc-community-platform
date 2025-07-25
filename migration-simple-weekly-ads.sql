-- Simple Weekly Advertisement System Migration for HSC
-- This replaces the complex bidding system with a simple weekly subscription model
-- 5 slots, $5/week base price, $10/week to bump positions

-- Drop the complex tables from the previous system (if they exist)
DROP TABLE IF EXISTS ad_analytics CASCADE;
DROP TABLE IF EXISTS ad_bids CASCADE;
DROP TABLE IF EXISTS ad_payments CASCADE;
DROP TABLE IF EXISTS premium_campaigns CASCADE;
DROP TABLE IF EXISTS ad_position_slots CASCADE;

-- Simple weekly advertisement subscriptions
CREATE TABLE IF NOT EXISTS weekly_ad_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Position & Pricing (1-5 slots only)
    position_slot INTEGER NOT NULL CHECK (position_slot BETWEEN 1 AND 5),
    weekly_price DECIMAL(10,2) NOT NULL CHECK (weekly_price IN (5.00, 10.00)),
    
    -- Subscription Period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    
    -- Stripe Integration
    stripe_subscription_id VARCHAR(255), -- For auto-renewal
    stripe_payment_intent_id VARCHAR(255), -- For one-time payments
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending_payment')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(position_slot, start_date, end_date) -- Only one ad per slot per time period
);

-- Track position changes when someone gets bumped
CREATE TABLE IF NOT EXISTS ad_position_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affected_subscription_id UUID NOT NULL REFERENCES weekly_ad_subscriptions(id) ON DELETE CASCADE,
    bumped_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bumped_by_subscription_id UUID NOT NULL REFERENCES weekly_ad_subscriptions(id) ON DELETE CASCADE,
    
    -- Position change details
    old_position INTEGER NOT NULL,
    new_position INTEGER NOT NULL,
    bump_price DECIMAL(10,2) NOT NULL,
    
    -- Timing
    bump_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Notification tracking
    notification_sent BOOLEAN DEFAULT FALSE
);

-- Simple analytics for ad performance (optional)
CREATE TABLE IF NOT EXISTS ad_simple_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES weekly_ad_subscriptions(id) ON DELETE CASCADE,
    
    -- Simple metrics
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    
    -- Constraints
    UNIQUE(subscription_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_ad_subscriptions_user_id ON weekly_ad_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_ad_subscriptions_listing_id ON weekly_ad_subscriptions(listing_id);
CREATE INDEX IF NOT EXISTS idx_weekly_ad_subscriptions_position_slot ON weekly_ad_subscriptions(position_slot);
CREATE INDEX IF NOT EXISTS idx_weekly_ad_subscriptions_status ON weekly_ad_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_weekly_ad_subscriptions_dates ON weekly_ad_subscriptions(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ad_position_changes_affected_subscription ON ad_position_changes(affected_subscription_id);
CREATE INDEX IF NOT EXISTS idx_ad_position_changes_bumped_by_user ON ad_position_changes(bumped_by_user_id);
CREATE INDEX IF NOT EXISTS idx_ad_position_changes_bump_date ON ad_position_changes(bump_date);

CREATE INDEX IF NOT EXISTS idx_ad_simple_analytics_subscription ON ad_simple_analytics(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ad_simple_analytics_date ON ad_simple_analytics(date);

-- Row Level Security
ALTER TABLE weekly_ad_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_position_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_simple_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_ad_subscriptions
CREATE POLICY "Users can view their own ad subscriptions" ON weekly_ad_subscriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own ad subscriptions" ON weekly_ad_subscriptions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own ad subscriptions" ON weekly_ad_subscriptions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all ad subscriptions" ON weekly_ad_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

-- RLS Policies for ad_position_changes (admins and affected users)
CREATE POLICY "Users can view position changes affecting them" ON ad_position_changes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM weekly_ad_subscriptions 
            WHERE weekly_ad_subscriptions.id = ad_position_changes.affected_subscription_id
            AND weekly_ad_subscriptions.user_id::text = auth.uid()::text
        )
        OR
        auth.uid()::text = bumped_by_user_id::text
    );

CREATE POLICY "System can create position change records" ON ad_position_changes
    FOR INSERT WITH CHECK (true); -- System creates these records

CREATE POLICY "Admins can view all position changes" ON ad_position_changes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

-- RLS Policies for ad_simple_analytics (users and admins)
CREATE POLICY "Users can view their own ad analytics" ON ad_simple_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM weekly_ad_subscriptions 
            WHERE weekly_ad_subscriptions.id = ad_simple_analytics.subscription_id
            AND weekly_ad_subscriptions.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all ad analytics" ON ad_simple_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

-- Functions for position management
CREATE OR REPLACE FUNCTION get_available_ad_slots(for_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    position_slot INTEGER,
    is_available BOOLEAN,
    current_user_id UUID,
    current_listing_title TEXT,
    weekly_price DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH all_slots AS (
        SELECT generate_series(1, 5) AS slot_number
    ),
    occupied_slots AS (
        SELECT 
            was.position_slot,
            was.user_id,
            l.title as listing_title,
            was.weekly_price
        FROM weekly_ad_subscriptions was
        JOIN listings l ON was.listing_id = l.id
        WHERE was.status = 'active'
        AND was.start_date <= for_date
        AND was.end_date >= for_date
    )
    SELECT 
        all_slots.slot_number,
        occupied_slots.position_slot IS NULL as is_available,
        occupied_slots.user_id,
        occupied_slots.listing_title,
        COALESCE(occupied_slots.weekly_price, 5.00) as weekly_price
    FROM all_slots
    LEFT JOIN occupied_slots ON all_slots.slot_number = occupied_slots.position_slot
    ORDER BY all_slots.slot_number;
END;
$$ LANGUAGE plpgsql;

-- Function to handle position bumping
CREATE OR REPLACE FUNCTION bump_ad_position(
    p_user_id UUID,
    p_listing_id UUID,
    p_target_position INTEGER,
    p_start_date DATE,
    p_end_date DATE,
    p_stripe_payment_intent_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_new_subscription_id UUID;
    v_affected_subscription record;
    v_position_to_bump INTEGER;
BEGIN
    -- Validate target position
    IF p_target_position < 1 OR p_target_position > 5 THEN
        RAISE EXCEPTION 'Invalid target position. Must be between 1 and 5.';
    END IF;
    
    -- Check if there's an existing subscription in the target position
    SELECT id, user_id, position_slot INTO v_affected_subscription
    FROM weekly_ad_subscriptions
    WHERE position_slot = p_target_position
    AND status = 'active'
    AND start_date <= p_end_date
    AND end_date >= p_start_date;
    
    -- If target position is occupied, bump everyone down
    IF v_affected_subscription.id IS NOT NULL THEN
        -- Find the next available position or bump chain
        FOR v_position_to_bump IN p_target_position..5 LOOP
            -- Move the existing subscription down one position
            UPDATE weekly_ad_subscriptions
            SET position_slot = position_slot + 1,
                updated_at = NOW()
            WHERE position_slot = v_position_to_bump
            AND status = 'active'
            AND start_date <= p_end_date
            AND end_date >= p_start_date;
            
            -- Record the position change
            INSERT INTO ad_position_changes (
                affected_subscription_id, 
                bumped_by_user_id, 
                bumped_by_subscription_id,
                old_position, 
                new_position, 
                bump_price
            )
            SELECT 
                id,
                p_user_id,
                v_new_subscription_id,
                v_position_to_bump,
                v_position_to_bump + 1,
                10.00
            FROM weekly_ad_subscriptions
            WHERE position_slot = v_position_to_bump + 1
            AND status = 'active'
            AND start_date <= p_end_date
            AND end_date >= p_start_date;
        END LOOP;
    END IF;
    
    -- Create the new subscription
    INSERT INTO weekly_ad_subscriptions (
        user_id,
        listing_id,
        position_slot,
        weekly_price,
        start_date,
        end_date,
        stripe_payment_intent_id,
        status
    ) VALUES (
        p_user_id,
        p_listing_id,
        p_target_position,
        CASE WHEN v_affected_subscription.id IS NOT NULL THEN 10.00 ELSE 5.00 END,
        p_start_date,
        p_end_date,
        p_stripe_payment_intent_id,
        'active'
    ) RETURNING id INTO v_new_subscription_id;
    
    RETURN v_new_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_ad_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE weekly_ad_subscriptions
    SET status = 'expired'
    WHERE status = 'active'
    AND end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_ad_subscriptions TO authenticated;
GRANT SELECT, INSERT ON ad_position_changes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ad_simple_analytics TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant admin permissions
GRANT ALL ON weekly_ad_subscriptions TO authenticated;
GRANT ALL ON ad_position_changes TO authenticated;
GRANT ALL ON ad_simple_analytics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE weekly_ad_subscriptions IS 'Simple weekly advertisement subscriptions with 5 position slots';
COMMENT ON TABLE ad_position_changes IS 'Track when advertisers get bumped by others paying more';
COMMENT ON TABLE ad_simple_analytics IS 'Basic view/click tracking for advertisements';

COMMENT ON FUNCTION get_available_ad_slots(DATE) IS 'Returns availability and pricing for all 5 ad slots';
COMMENT ON FUNCTION bump_ad_position(UUID, UUID, INTEGER, DATE, DATE, VARCHAR) IS 'Handles position bumping logic when someone pays to move up';
COMMENT ON FUNCTION cleanup_expired_ad_subscriptions() IS 'Cleans up expired ad subscriptions - run daily';

-- Insert initial data for testing (optional)
-- You can uncomment these lines to add test data
/*
INSERT INTO weekly_ad_subscriptions (user_id, listing_id, position_slot, weekly_price, start_date, end_date, status) 
VALUES 
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1, 5.00, CURRENT_DATE, CURRENT_DATE + 7, 'active'),
    ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 2, 5.00, CURRENT_DATE, CURRENT_DATE + 7, 'active');
*/ 