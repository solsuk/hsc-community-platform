-- Premium Advertisement System Migration for HSC
-- This migration adds bidding, analytics, and payment features for premium advertisements

-- Premium Advertisement Campaigns Table
CREATE TABLE IF NOT EXISTS premium_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Campaign details
    campaign_name VARCHAR(255) NOT NULL,
    target_position INTEGER NOT NULL DEFAULT 1, -- 1=top row, 2=second row, etc.
    
    -- Bidding information
    bid_amount DECIMAL(10,2) NOT NULL, -- USD amount bid for position
    max_daily_budget DECIMAL(10,2) NOT NULL,
    current_daily_spend DECIMAL(10,2) DEFAULT 0,
    
    -- Campaign status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'pending_payment')),
    
    -- Timing
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Payment tracking
    stripe_payment_intent_id VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Analytics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    cost_per_click DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Premium Advertisement Bids Table (for auction history)
CREATE TABLE IF NOT EXISTS ad_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES premium_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Bid details
    position_slot INTEGER NOT NULL, -- Which top-row position (1-6)
    bid_amount DECIMAL(10,2) NOT NULL,
    bid_type VARCHAR(20) NOT NULL DEFAULT 'cpc' CHECK (bid_type IN ('cpc', 'cpm', 'flat_rate')),
    
    -- Bid status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'outbid', 'won', 'expired')),
    
    -- Auction timing
    bid_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advertisement Analytics Table (detailed tracking)
CREATE TABLE IF NOT EXISTS ad_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES premium_campaigns(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('impression', 'click', 'contact', 'conversion')),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User context
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_agent TEXT,
    referrer VARCHAR(500),
    
    -- Position tracking
    position_displayed INTEGER, -- Which position was shown
    page_scroll_depth INTEGER, -- How far user scrolled
    
    -- Geographic data
    ip_address INET,
    city VARCHAR(100),
    region VARCHAR(100),
    
    -- Cost tracking
    cost_charged DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advertisement Position Slots (defines available premium positions)
CREATE TABLE IF NOT EXISTS ad_position_slots (
    id SERIAL PRIMARY KEY,
    position_name VARCHAR(50) NOT NULL,
    position_order INTEGER NOT NULL,
    max_advertisers INTEGER NOT NULL DEFAULT 1,
    base_cost_per_click DECIMAL(10,2) NOT NULL DEFAULT 0.50,
    
    -- Position characteristics
    is_top_row BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    visibility_score INTEGER DEFAULT 100, -- 100 = highest visibility
    
    -- Pricing rules
    minimum_bid DECIMAL(10,2) NOT NULL DEFAULT 0.10,
    maximum_bid DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default premium position slots
INSERT INTO ad_position_slots (position_name, position_order, max_advertisers, base_cost_per_click, is_top_row, is_premium, visibility_score, minimum_bid, maximum_bid) VALUES
('Top Row Position 1', 1, 1, 1.00, TRUE, TRUE, 100, 0.25, 25.00),
('Top Row Position 2', 2, 1, 0.90, TRUE, TRUE, 95, 0.20, 20.00),
('Top Row Position 3', 3, 1, 0.80, TRUE, TRUE, 90, 0.15, 15.00),
('Top Row Position 4', 4, 1, 0.70, TRUE, TRUE, 85, 0.15, 15.00),
('Top Row Position 5', 5, 1, 0.60, TRUE, TRUE, 80, 0.10, 10.00),
('Top Row Position 6', 6, 1, 0.50, TRUE, TRUE, 75, 0.10, 10.00),
('Second Row Premium', 7, 3, 0.40, FALSE, TRUE, 60, 0.05, 5.00),
('Standard Premium', 8, 5, 0.25, FALSE, TRUE, 40, 0.05, 3.00)
ON CONFLICT (position_name) DO NOTHING;

-- Payment Records Table
CREATE TABLE IF NOT EXISTS ad_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES premium_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50), -- 'stripe', 'paypal', etc.
    
    -- Stripe integration
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    
    -- Payment status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
    
    -- Payment timing
    processed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_premium_campaigns_user_id ON premium_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_campaigns_listing_id ON premium_campaigns(listing_id);
CREATE INDEX IF NOT EXISTS idx_premium_campaigns_status ON premium_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_premium_campaigns_target_position ON premium_campaigns(target_position);
CREATE INDEX IF NOT EXISTS idx_premium_campaigns_bid_amount ON premium_campaigns(bid_amount);

CREATE INDEX IF NOT EXISTS idx_ad_bids_campaign_id ON ad_bids(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_bids_position_slot ON ad_bids(position_slot);
CREATE INDEX IF NOT EXISTS idx_ad_bids_bid_amount ON ad_bids(bid_amount);
CREATE INDEX IF NOT EXISTS idx_ad_bids_status ON ad_bids(status);

CREATE INDEX IF NOT EXISTS idx_ad_analytics_campaign_id ON ad_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_event_type ON ad_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_event_timestamp ON ad_analytics(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_position_displayed ON ad_analytics(position_displayed);

CREATE INDEX IF NOT EXISTS idx_ad_payments_campaign_id ON ad_payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_payments_status ON ad_payments(status);
CREATE INDEX IF NOT EXISTS idx_ad_payments_stripe_payment_intent_id ON ad_payments(stripe_payment_intent_id);

-- Row Level Security
ALTER TABLE premium_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_position_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for premium_campaigns
CREATE POLICY "Users can view their own campaigns" ON premium_campaigns
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own campaigns" ON premium_campaigns
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own campaigns" ON premium_campaigns
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all campaigns" ON premium_campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

-- RLS Policies for ad_bids
CREATE POLICY "Users can view their own bids" ON ad_bids
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own bids" ON ad_bids
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for ad_analytics (admins and campaign owners only)
CREATE POLICY "Campaign owners can view their analytics" ON ad_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM premium_campaigns 
            WHERE premium_campaigns.id = ad_analytics.campaign_id
            AND premium_campaigns.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all analytics" ON ad_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.is_admin = TRUE
        )
    );

-- RLS Policies for ad_position_slots (public read-only)
CREATE POLICY "Position slots are publicly readable" ON ad_position_slots
    FOR SELECT USING (true);

-- RLS Policies for ad_payments
CREATE POLICY "Users can view their own payments" ON ad_payments
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own payments" ON ad_payments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Functions for bidding logic
CREATE OR REPLACE FUNCTION get_current_winning_bids()
RETURNS TABLE (
    position_slot INTEGER,
    winning_bid_amount DECIMAL(10,2),
    campaign_id UUID,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (ab.position_slot)
        ab.position_slot,
        ab.bid_amount,
        ab.campaign_id,
        ab.user_id
    FROM ad_bids ab
    JOIN premium_campaigns pc ON ab.campaign_id = pc.id
    WHERE ab.status = 'active'
    AND pc.status = 'active'
    AND pc.payment_status = 'paid'
    ORDER BY ab.position_slot, ab.bid_amount DESC, ab.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate dynamic pricing based on demand
CREATE OR REPLACE FUNCTION calculate_dynamic_price(target_position INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    base_price DECIMAL(10,2);
    active_bids_count INTEGER;
    demand_multiplier DECIMAL(3,2);
    final_price DECIMAL(10,2);
BEGIN
    -- Get base price for position
    SELECT base_cost_per_click INTO base_price
    FROM ad_position_slots
    WHERE position_order = target_position;
    
    -- Count active bids for this position
    SELECT COUNT(*) INTO active_bids_count
    FROM ad_bids ab
    JOIN premium_campaigns pc ON ab.campaign_id = pc.id
    WHERE ab.position_slot = target_position
    AND ab.status = 'active'
    AND pc.status = 'active';
    
    -- Calculate demand multiplier (more competition = higher price)
    demand_multiplier := 1.0 + (active_bids_count * 0.1);
    
    -- Calculate final price
    final_price := base_price * demand_multiplier;
    
    RETURN final_price;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update campaign spend
CREATE OR REPLACE FUNCTION update_campaign_spend()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'click' AND NEW.cost_charged > 0 THEN
        UPDATE premium_campaigns
        SET current_daily_spend = current_daily_spend + NEW.cost_charged
        WHERE id = NEW.campaign_id;
        
        -- Check if daily budget exceeded
        UPDATE premium_campaigns
        SET status = 'paused'
        WHERE id = NEW.campaign_id
        AND current_daily_spend >= max_daily_budget;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update campaign spend on analytics events
CREATE TRIGGER update_campaign_spend_trigger
    AFTER INSERT ON ad_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_spend();

-- Function to reset daily spend (run this daily via cron)
CREATE OR REPLACE FUNCTION reset_daily_spend()
RETURNS void AS $$
BEGIN
    UPDATE premium_campaigns
    SET current_daily_spend = 0
    WHERE status IN ('active', 'paused');
    
    -- Reactivate paused campaigns that were paused due to budget
    UPDATE premium_campaigns
    SET status = 'active'
    WHERE status = 'paused'
    AND current_daily_spend = 0;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON premium_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ad_bids TO authenticated;
GRANT SELECT, INSERT ON ad_analytics TO authenticated;
GRANT SELECT ON ad_position_slots TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON ad_payments TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE premium_campaigns IS 'Premium advertisement campaigns with bidding and budget management';
COMMENT ON TABLE ad_bids IS 'Individual bids for premium advertisement positions';
COMMENT ON TABLE ad_analytics IS 'Detailed analytics tracking for advertisement performance';
COMMENT ON TABLE ad_position_slots IS 'Available premium positions with pricing and characteristics';
COMMENT ON TABLE ad_payments IS 'Payment records for advertisement campaigns';

COMMENT ON FUNCTION get_current_winning_bids() IS 'Returns the current winning bid for each position slot';
COMMENT ON FUNCTION calculate_dynamic_price(INTEGER) IS 'Calculates dynamic pricing based on demand for a position';
COMMENT ON FUNCTION reset_daily_spend() IS 'Resets daily spend counters - run daily via cron'; 