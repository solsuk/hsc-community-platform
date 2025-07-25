-- Fix for infinite recursion in ad_bids trigger
-- The issue: trigger fires on ANY UPDATE, but calculate_ad_positions() also UPDATEs the same table

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS ad_bids_position_trigger ON ad_bids;

-- Create a new trigger that only fires on relevant column changes
-- This prevents recursion when calculate_ad_positions() updates current_position
CREATE TRIGGER ad_bids_position_trigger
  AFTER INSERT OR DELETE OR UPDATE OF weekly_bid_amount, status, week_start, week_end ON ad_bids
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_positions();

-- Note: This trigger now only fires when:
-- - New bids are inserted
-- - Bids are deleted  
-- - The bid amount (weekly_bid_amount) changes
-- - The status changes
-- - The week dates change
-- 
-- It will NOT fire when current_position or updated_at are modified by calculate_ad_positions()

SELECT 'Ad bidding recursion fix applied successfully' as status; 