-- Database Update: Add 'wanted' support to existing categories
-- This should be run in Supabase SQL Editor when convenient
-- Currently using 'sell' categories as fallback in frontend

-- Update existing categories to support 'wanted' listings
UPDATE listing_categories 
SET applies_to = array_append(applies_to, 'wanted') 
WHERE 'wanted' != ALL(applies_to) 
  AND name NOT IN ('free'); -- Free items don't make sense for wanted listings

-- Verify the update
SELECT name, display_name, applies_to 
FROM listing_categories 
ORDER BY sort_order;

-- After running this update, you can remove the fallback logic 
-- in the frontend components that uses 'sell' categories for 'wanted' 