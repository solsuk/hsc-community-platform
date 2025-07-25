-- Enhanced Listings Migration for HSC
-- This migration adds all new fields required for comprehensive listing functionality

-- Add new columns to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS basic_description TEXT,
ADD COLUMN IF NOT EXISTS detailed_description TEXT,
ADD COLUMN IF NOT EXISTS video_urls TEXT[],
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'draft')),
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

-- Update the type constraint to include our listing types
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_type_check;
ALTER TABLE listings ADD CONSTRAINT listings_type_check 
  CHECK (type IN ('sell', 'trade', 'announce', 'advertise'));

-- Rename description to legacy_description for backward compatibility
ALTER TABLE listings RENAME COLUMN description TO legacy_description;

-- Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Update RLS policies to handle new fields
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public listings are visible to all" ON listings;
DROP POLICY IF EXISTS "Private listings visible to community members" ON listings;

-- Recreate policies with enhanced logic
CREATE POLICY "Public listings are visible to all" ON listings
    FOR SELECT USING (
        is_private = FALSE 
        AND status = 'active'
    );

CREATE POLICY "Private listings visible to community members" ON listings
    FOR SELECT USING (
        is_private = TRUE 
        AND status = 'active'
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.community_verified = TRUE
        )
    );

-- Draft listings are only visible to their owners
CREATE POLICY "Users can view their draft listings" ON listings
    FOR SELECT USING (
        auth.uid()::text = user_id::text
        AND status = 'draft'
    );

-- Add a function to update listing status automatically
CREATE OR REPLACE FUNCTION auto_expire_listings()
RETURNS void AS $$
BEGIN
    -- Auto-expire listings older than 90 days
    UPDATE listings 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Create predefined categories for dropdown
CREATE TABLE IF NOT EXISTS listing_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    applies_to VARCHAR(20)[] DEFAULT ARRAY['sell', 'trade'],
    sort_order INTEGER DEFAULT 0
);

-- Insert predefined categories
INSERT INTO listing_categories (name, display_name, applies_to, sort_order) VALUES
('autos', 'Autos & Vehicles', ARRAY['sell', 'trade'], 1),
('boats', 'Boats & Marine', ARRAY['sell', 'trade'], 2),
('furniture', 'Furniture', ARRAY['sell', 'trade'], 3),
('materials', 'Materials & Supplies', ARRAY['sell', 'trade'], 4),
('free', 'Free Items', ARRAY['sell'], 5),
('collectibles', 'Collectibles & Antiques', ARRAY['sell', 'trade'], 6),
('musical_instruments', 'Musical Instruments', ARRAY['sell', 'trade'], 7),
('clothing', 'Clothing & Accessories', ARRAY['sell', 'trade'], 8),
('games', 'Games & Toys', ARRAY['sell', 'trade'], 9),
('electronics', 'Electronics', ARRAY['sell', 'trade'], 10),
('tools', 'Tools & Equipment', ARRAY['sell', 'trade'], 11),
('home_garden', 'Home & Garden', ARRAY['sell', 'trade'], 12),
('sports_recreation', 'Sports & Recreation', ARRAY['sell', 'trade'], 13),
('baby_kids', 'Baby & Kids', ARRAY['sell', 'trade'], 14),
('books_media', 'Books & Media', ARRAY['sell', 'trade'], 15)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions on new table
GRANT SELECT ON listing_categories TO anon, authenticated;

-- Add comments for documentation
COMMENT ON COLUMN listings.category IS 'Category slug from listing_categories table';
COMMENT ON COLUMN listings.price IS 'Price in USD, NULL for trade/announce listings';
COMMENT ON COLUMN listings.basic_description IS 'Short description (150 chars max) for previews';
COMMENT ON COLUMN listings.detailed_description IS 'Rich text HTML content for full description';
COMMENT ON COLUMN listings.video_urls IS 'Array of video URLs (YouTube/Vimeo embeds or Supabase storage)';
COMMENT ON COLUMN listings.status IS 'active, sold, expired, or draft';
COMMENT ON COLUMN listings.featured_image_url IS 'Primary image URL for thumbnails and previews';

-- Create a view for easy category joining
CREATE OR REPLACE VIEW listings_with_categories AS
SELECT 
    l.*,
    lc.display_name as category_display_name
FROM listings l
LEFT JOIN listing_categories lc ON l.category = lc.name;

-- Grant access to the view
GRANT SELECT ON listings_with_categories TO anon, authenticated; 