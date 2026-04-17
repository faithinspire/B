-- ============================================================================
-- FIX VERIFICATION STATUS - Convert enum to TEXT
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Convert verification_status column from enum to TEXT type
-- This allows any string value including 'approved', 'rejected', 'pending'
ALTER TABLE braider_profiles 
  ALTER COLUMN verification_status TYPE TEXT;

-- Set default value
ALTER TABLE braider_profiles 
  ALTER COLUMN verification_status SET DEFAULT 'unverified';

-- Update any NULL values
UPDATE braider_profiles 
SET verification_status = 'unverified' 
WHERE verification_status IS NULL;

-- ============================================================================
-- DONE - verification_status column now accepts any text value
-- ============================================================================
