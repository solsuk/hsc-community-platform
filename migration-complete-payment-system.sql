-- Complete Payment System Migration
-- Fixes table conflicts and creates all necessary tables for Stripe integration

-- First, clean up any existing conflicting policies
DROP POLICY IF EXISTS "Anyone can view active bids" ON ad_bids;
DROP POLICY IF EXISTS "Users can manage own bids" ON ad_bids;
DROP POLICY IF EXISTS "Admins can manage all bids" ON ad_bids;
DROP POLICY IF EXISTS "Users can view own payments" ON ad_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON ad_payments;
DROP POLICY IF EXISTS "Users can view active weekly ads" ON weekly_ads;
DROP POLICY IF EXISTS "Users can manage own weekly ads" ON weekly_ads;
DROP POLICY IF EXISTS "Admins can manage all weekly ads" ON weekly_ads;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS calculate_ad_positions();
DROP FUNCTION IF EXISTS get_current_top_bid();
DROP FUNCTION IF EXISTS get_price_to_beat();
DROP FUNCTION IF EXISTS trigger_calculate_positions();
DROP FUNCTION IF EXISTS get_available_ad_slots(DATE);

-- Drop triggers
DROP TRIGGER IF EXISTS ad_bids_position_trigger ON ad_bids;

-- CREATE WEEKLY_ADS TABLE (Expected by API)
CREATE TABLE IF NOT EXISTS weekly_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  position_slot INTEGER NOT NULL CHECK (position_slot BETWEEN 1 AND 5),
  weekly_price DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  listing_title TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '6 days'),
  is_active BOOLEAN DEFAULT true,
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CREATE AD_BIDS TABLE (For competitive bidding)
CREATE TABLE IF NOT EXISTS ad_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_bid_amount DECIMAL(10,2) NOT NULL CHECK (weekly_bid_amount >= 5.00),
  max_auto_bid DECIMAL(10,2) CHECK (max_auto_bid IS NULL OR max_auto_bid >= weekly_bid_amount),
  auto_renew BOOLEAN DEFAULT true,
  week_start DATE NOT NULL DEFAULT CURRENT_DATE,
  week_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '6 days'),
  current_position INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CREATE AD_PAYMENTS TABLE (For Stripe payment tracking)
CREATE TABLE IF NOT EXISTS ad_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  payment_type TEXT CHECK (payment_type IN ('one_time', 'subscription')),
  auto_renew BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR WEEKLY_ADS
CREATE INDEX IF NOT EXISTS weekly_ads_user_id_idx ON weekly_ads(user_id);
CREATE INDEX IF NOT EXISTS weekly_ads_listing_id_idx ON weekly_ads(listing_id);
CREATE INDEX IF NOT EXISTS weekly_ads_position_slot_idx ON weekly_ads(position_slot);
CREATE INDEX IF NOT EXISTS weekly_ads_active_idx ON weekly_ads(is_active, end_date);
CREATE INDEX IF NOT EXISTS weekly_ads_dates_idx ON weekly_ads(start_date, end_date);

-- INDEXES FOR AD_BIDS  
CREATE INDEX IF NOT EXISTS ad_bids_bid_amount_idx ON ad_bids(weekly_bid_amount DESC, created_at ASC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS ad_bids_user_id_idx ON ad_bids(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_bids_week_range_idx ON ad_bids(week_start, week_end, status);

-- INDEXES FOR AD_PAYMENTS
CREATE INDEX IF NOT EXISTS ad_payments_user_id_idx ON ad_payments(user_id);
CREATE INDEX IF NOT EXISTS ad_payments_listing_id_idx ON ad_payments(listing_id);
CREATE INDEX IF NOT EXISTS ad_payments_stripe_session_id_idx ON ad_payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS ad_payments_created_at_idx ON ad_payments(created_at DESC);

-- UNIQUE CONSTRAINTS
CREATE UNIQUE INDEX IF NOT EXISTS weekly_ads_position_week_unique ON weekly_ads(position_slot, start_date) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS ad_bids_listing_week_unique ON ad_bids(listing_id, week_start) WHERE status = 'active';

-- ENABLE RLS ON ALL TABLES
ALTER TABLE weekly_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_payments ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR WEEKLY_ADS
CREATE POLICY "Users can view active weekly ads" ON weekly_ads FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own weekly ads" ON weekly_ads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all weekly ads" ON weekly_ads FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- RLS POLICIES FOR AD_BIDS
CREATE POLICY "Anyone can view active bids" ON ad_bids FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage own bids" ON ad_bids FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all bids" ON ad_bids FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- RLS POLICIES FOR AD_PAYMENTS  
CREATE POLICY "Users can view own payments" ON ad_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON ad_payments FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- BIDDING SYSTEM FUNCTIONS
CREATE OR REPLACE FUNCTION get_current_top_bid()
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(weekly_bid_amount) 
     FROM ad_bids 
     WHERE status = 'active'
       AND week_start <= CURRENT_DATE
       AND week_end >= CURRENT_DATE),
    0.00
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_price_to_beat()
RETURNS DECIMAL(10,2) AS $$
DECLARE
  current_top DECIMAL(10,2);
BEGIN
  current_top := get_current_top_bid();
  
  IF current_top = 0.00 THEN
    RETURN 5.00; -- Base price if no bids yet
  ELSE
    RETURN current_top + 5.00; -- Current top + $5
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_ad_positions()
RETURNS void AS $$
BEGIN
  -- Update positions for current week's active bids
  WITH ranked_bids AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY weekly_bid_amount DESC, created_at ASC
      ) as new_position
    FROM ad_bids
    WHERE status = 'active'
      AND week_start <= CURRENT_DATE
      AND week_end >= CURRENT_DATE
  )
  UPDATE ad_bids 
  SET 
    current_position = ranked_bids.new_position,
    updated_at = NOW()
  FROM ranked_bids 
  WHERE ad_bids.id = ranked_bids.id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_ad_slots(for_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  position_slot INTEGER,
  is_available BOOLEAN,
  current_price DECIMAL(10,2),
  current_occupant_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH slot_positions AS (
    SELECT generate_series(1, 5) as slot_num
  ),
  occupied_slots AS (
    SELECT 
      w.position_slot,
      w.weekly_price,
      w.listing_title
    FROM weekly_ads w
    WHERE w.is_active = true 
      AND w.start_date <= for_date 
      AND w.end_date >= for_date
  )
  SELECT 
    sp.slot_num,
    (os.position_slot IS NULL) as is_available,
    COALESCE(os.weekly_price, 5.00) as current_price,
    os.listing_title as current_occupant_title
  FROM slot_positions sp
  LEFT JOIN occupied_slots os ON sp.slot_num = os.position_slot
  ORDER BY sp.slot_num;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION trigger_calculate_positions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_ad_positions();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
CREATE TRIGGER ad_bids_position_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ad_bids
  EXECUTE FUNCTION trigger_calculate_positions();

-- COMMENTS
COMMENT ON TABLE weekly_ads IS 'Weekly advertisement placements in premium positions';
COMMENT ON TABLE ad_bids IS 'Competitive bidding system for ad placement positions';
COMMENT ON TABLE ad_payments IS 'Payment tracking for business advertisements';
COMMENT ON FUNCTION get_current_top_bid() IS 'Returns the current highest bid amount';
COMMENT ON FUNCTION get_price_to_beat() IS 'Returns the price needed to take position #1';
COMMENT ON FUNCTION calculate_ad_positions() IS 'Recalculates all ad positions based on current bid amounts';
COMMENT ON FUNCTION get_available_ad_slots(DATE) IS 'Returns availability status for all 5 ad positions'; 