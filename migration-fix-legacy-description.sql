-- Fix for legacy_description NOT NULL constraint
-- This allows the field to be nullable since we're using the new description fields

ALTER TABLE listings ALTER COLUMN legacy_description DROP NOT NULL; 