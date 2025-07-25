-- Fix for algorithm_config table missing community_id column
-- This handles the case where the table creation might have failed

-- First, ensure communities table exists
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    domain VARCHAR(100),
    subdomain VARCHAR(50),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert HSC community if it doesn't exist
INSERT INTO communities (id, name, display_name, description, domain, subdomain, settings)
VALUES (
    'HSC',
    'hillsmere_shores',
    'Hillsmere Shores Classifieds',
    'Hyper-localized community marketplace for Hillsmere Shores, Maryland',
    'hsc.matakey.com',
    'hsc',
    '{"primary_color": "#10B981", "tagline": "Hyper localized community solutions"}'
) ON CONFLICT (id) DO NOTHING;

-- Drop and recreate algorithm_config table to ensure it has the correct structure
DROP TABLE IF EXISTS algorithm_config CASCADE;

CREATE TABLE algorithm_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id VARCHAR(50) REFERENCES communities(id) DEFAULT 'HSC',
    algorithm_name VARCHAR(100) NOT NULL DEFAULT 'engagement_score',
    weight_age DECIMAL(3,2) DEFAULT 0.60,
    weight_clicks DECIMAL(3,2) DEFAULT 0.40,
    weight_recency DECIMAL(3,2) DEFAULT 0.00,
    algorithm_enabled BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default algorithm config for HSC
INSERT INTO algorithm_config (community_id, algorithm_name, weight_age, weight_clicks, settings)
VALUES (
    'HSC',
    'engagement_score',
    0.60,
    0.40,
    '{"description": "User-defined algorithm: score = (1/(hours+1)) * 0.6 + (clicks/max_clicks) * 0.4"}'
);

SELECT 'Algorithm config table fixed successfully' as status; 