-- Migration: Fix auth_tokens.token column length
-- Run this in your Supabase SQL Editor

-- First, drop the existing unique constraint if it exists
ALTER TABLE auth_tokens DROP CONSTRAINT IF EXISTS auth_tokens_token_key;

-- Change the column type from VARCHAR(255) to TEXT
ALTER TABLE auth_tokens ALTER COLUMN token TYPE TEXT;

-- Re-add the unique constraint
ALTER TABLE auth_tokens ADD CONSTRAINT auth_tokens_token_key UNIQUE (token);

-- Verify the change
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'auth_tokens' AND column_name = 'token'; 