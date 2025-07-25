-- Fix for content_reports table with invalid INDEX syntax
-- The issue: INDEX syntax in CREATE TABLE is invalid in PostgreSQL

-- Drop and recreate the content_reports table with correct syntax
DROP TABLE IF EXISTS content_reports CASCADE;

CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    community_id VARCHAR(50) REFERENCES communities(id) DEFAULT 'HSC',
    reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL, -- 'spam', 'inappropriate', 'fraud', 'other'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes separately (correct PostgreSQL syntax)
CREATE INDEX IF NOT EXISTS idx_content_reports_listing ON content_reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_community ON content_reports(community_id);

-- Enable RLS on the table
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY content_reports_user_policy ON content_reports
    FOR SELECT USING (
        reporter_user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY content_reports_create_policy ON content_reports
    FOR INSERT WITH CHECK (reporter_user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT ON content_reports TO authenticated;

SELECT 'Content reports table fixed successfully' as status; 