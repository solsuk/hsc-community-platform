-- Supplementary Migration: Create weekly_ads table
-- This table is expected by the weekly-ads API but was missing from the main migration

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

-- Create indexes
CREATE INDEX IF NOT EXISTS weekly_ads_user_id_idx ON weekly_ads(user_id);
CREATE INDEX IF NOT EXISTS weekly_ads_listing_id_idx ON weekly_ads(listing_id);
CREATE INDEX IF NOT EXISTS weekly_ads_position_slot_idx ON weekly_ads(position_slot);
CREATE INDEX IF NOT EXISTS weekly_ads_active_idx ON weekly_ads(is_active, end_date);
CREATE INDEX IF NOT EXISTS weekly_ads_dates_idx ON weekly_ads(start_date, end_date);

-- Add unique constraint: one listing per position per week
CREATE UNIQUE INDEX IF NOT EXISTS weekly_ads_position_week_unique 
ON weekly_ads(position_slot, start_date) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE weekly_ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view active weekly ads" ON weekly_ads
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage own weekly ads" ON weekly_ads
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all weekly ads" ON weekly_ads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to get available ad slots
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

COMMENT ON TABLE weekly_ads IS 'Weekly advertisement placements in premium positions';
COMMENT ON FUNCTION get_available_ad_slots(DATE) IS 'Returns availability status for all 5 ad positions'; 