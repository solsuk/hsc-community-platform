-- Ad Bidding System Migration
-- Run this in Supabase SQL Editor to add bidding functionality

-- Create ad_bids table for competitive positioning
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

-- Create unique constraint: one bid per listing per week
CREATE UNIQUE INDEX IF NOT EXISTS ad_bids_listing_week_unique 
ON ad_bids(listing_id, week_start) 
WHERE status = 'active';

-- Create index for position calculations (by bid amount)
CREATE INDEX IF NOT EXISTS ad_bids_bid_amount_idx 
ON ad_bids(weekly_bid_amount DESC, created_at ASC) 
WHERE status = 'active';

-- Create index for user's bids
CREATE INDEX IF NOT EXISTS ad_bids_user_id_idx 
ON ad_bids(user_id, created_at DESC);

-- Create index for weekly queries
CREATE INDEX IF NOT EXISTS ad_bids_week_range_idx 
ON ad_bids(week_start, week_end, status);

-- Add RLS (Row Level Security) policies
ALTER TABLE ad_bids ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all active bids (for market transparency)
CREATE POLICY "Anyone can view active bids" ON ad_bids
  FOR SELECT
  USING (status = 'active');

-- Policy: Users can only insert/update their own bids
CREATE POLICY "Users can manage own bids" ON ad_bids
  FOR ALL
  USING (auth.uid() = user_id);

-- Policy: Admin can manage all bids
CREATE POLICY "Admins can manage all bids" ON ad_bids
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to calculate current positions based on bid amounts
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

-- Function to get current top bid amount
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

-- Function to get price to beat current top position
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

-- Trigger to automatically calculate positions when bids change
CREATE OR REPLACE FUNCTION trigger_calculate_positions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_ad_positions();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic position recalculation
DROP TRIGGER IF EXISTS ad_bids_position_trigger ON ad_bids;
CREATE TRIGGER ad_bids_position_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ad_bids
  EXECUTE FUNCTION trigger_calculate_positions();

-- Create ad_payments table for payment tracking
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

-- Create indexes for ad_payments
CREATE INDEX IF NOT EXISTS ad_payments_user_id_idx ON ad_payments(user_id);
CREATE INDEX IF NOT EXISTS ad_payments_listing_id_idx ON ad_payments(listing_id);
CREATE INDEX IF NOT EXISTS ad_payments_stripe_session_id_idx ON ad_payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS ad_payments_created_at_idx ON ad_payments(created_at DESC);

-- Add RLS policies for ad_payments
ALTER TABLE ad_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payments
CREATE POLICY "Users can view own payments" ON ad_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admin can view all payments
CREATE POLICY "Admins can view all payments" ON ad_payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add comment for documentation
COMMENT ON TABLE ad_bids IS 'Competitive bidding system for ad placement positions';
COMMENT ON TABLE ad_payments IS 'Payment tracking for business advertisements';
COMMENT ON FUNCTION calculate_ad_positions() IS 'Recalculates all ad positions based on current bid amounts';
COMMENT ON FUNCTION get_current_top_bid() IS 'Returns the current highest bid amount';
COMMENT ON FUNCTION get_price_to_beat() IS 'Returns the price needed to take position #1'; 