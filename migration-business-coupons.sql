-- Migration: Add business coupons and QR code functionality
-- Creates tables for storing business coupons and tracking downloads

-- Create business_coupons table
CREATE TABLE IF NOT EXISTS business_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    business_id UUID NOT NULL,
    business_email VARCHAR(255),
    business_name VARCHAR(255),
    
    -- Coupon content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    discount_text VARCHAR(255) NOT NULL,
    
    -- QR code and destination
    qr_destination TEXT,
    
    -- Validity
    expiration_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Analytics
    download_count INTEGER DEFAULT 0,
    last_downloaded TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupon_downloads table for tracking individual downloads
CREATE TABLE IF NOT EXISTS coupon_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES business_coupons(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    business_id UUID NOT NULL,
    
    -- Customer information (anonymous)
    customer_ip VARCHAR(45),
    user_agent TEXT,
    
    -- Download tracking
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_coupons_listing_id ON business_coupons(listing_id);
CREATE INDEX IF NOT EXISTS idx_business_coupons_business_id ON business_coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_business_coupons_is_active ON business_coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_business_coupons_expiration ON business_coupons(expiration_date);

CREATE INDEX IF NOT EXISTS idx_coupon_downloads_coupon_id ON coupon_downloads(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_downloads_business_id ON coupon_downloads(business_id);
CREATE INDEX IF NOT EXISTS idx_coupon_downloads_downloaded_at ON coupon_downloads(downloaded_at);

-- Create updated_at trigger for business_coupons
CREATE OR REPLACE FUNCTION update_business_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_business_coupons_updated_at ON business_coupons;
CREATE TRIGGER trigger_update_business_coupons_updated_at
    BEFORE UPDATE ON business_coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_business_coupons_updated_at();

-- Add RLS policies for business_coupons
ALTER TABLE business_coupons ENABLE ROW LEVEL SECURITY;

-- Users can create coupons for their own businesses
CREATE POLICY "Users can create coupons for their own businesses" ON business_coupons
    FOR INSERT WITH CHECK (auth.uid() = business_id);

-- Users can view and update their own coupons
CREATE POLICY "Users can manage their own coupons" ON business_coupons
    FOR ALL USING (auth.uid() = business_id);

-- Anyone can view active coupons (for display purposes)
CREATE POLICY "Anyone can view active coupons" ON business_coupons
    FOR SELECT USING (is_active = true);

-- Add RLS policies for coupon_downloads  
ALTER TABLE coupon_downloads ENABLE ROW LEVEL SECURITY;

-- Business owners can view downloads of their coupons
CREATE POLICY "Business owners can view their coupon downloads" ON coupon_downloads
    FOR SELECT USING (auth.uid() = business_id);

-- Service role can insert download records
CREATE POLICY "Service role can insert download records" ON coupon_downloads
    FOR INSERT WITH CHECK (true);

-- Add helpful functions for coupon management
CREATE OR REPLACE FUNCTION get_business_coupon_stats(business_user_id UUID)
RETURNS TABLE (
    total_coupons INTEGER,
    active_coupons INTEGER,
    total_downloads INTEGER,
    top_performing_coupon_title VARCHAR(255),
    top_performing_coupon_downloads INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_coupons,
        COUNT(CASE WHEN is_active = true AND (expiration_date IS NULL OR expiration_date > NOW()) THEN 1 END)::INTEGER as active_coupons,
        COALESCE(SUM(download_count), 0)::INTEGER as total_downloads,
        (SELECT title FROM business_coupons WHERE business_id = business_user_id ORDER BY download_count DESC LIMIT 1) as top_performing_coupon_title,
        (SELECT MAX(download_count) FROM business_coupons WHERE business_id = business_user_id)::INTEGER as top_performing_coupon_downloads
    FROM business_coupons 
    WHERE business_id = business_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to clean up expired coupons
CREATE OR REPLACE FUNCTION cleanup_expired_coupons()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE business_coupons 
    SET is_active = false, updated_at = NOW()
    WHERE expiration_date < NOW() 
    AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE business_coupons IS 'Stores QR code coupons created by businesses for their advertisements';
COMMENT ON TABLE coupon_downloads IS 'Tracks individual coupon downloads for analytics and notifications';
COMMENT ON FUNCTION get_business_coupon_stats(UUID) IS 'Returns coupon statistics for a specific business';
COMMENT ON FUNCTION cleanup_expired_coupons() IS 'Deactivates expired coupons and returns count of deactivated coupons';

-- Insert some sample data for testing (remove in production)
-- INSERT INTO business_coupons (
--     listing_id, business_id, business_email, business_name,
--     title, description, discount_text, qr_destination,
--     expiration_date, is_active
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000'::UUID, -- Replace with actual listing ID
--     '00000000-0000-0000-0000-000000000001'::UUID, -- Replace with actual business ID
--     'restaurant@example.com',
--     'Sample Restaurant',
--     'Welcome Special',
--     'Get 20% off your first order when you show this coupon',
--     '20% Off First Order',
--     'https://example.com/menu',
--     NOW() + INTERVAL '30 days',
--     true
-- );

COMMIT; 