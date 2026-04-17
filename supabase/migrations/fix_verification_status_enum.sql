-- ============================================================================
-- FIX VERIFICATION STATUS ENUM
-- Run this in Supabase SQL Editor
-- ============================================================================
-- The verification_status column uses an enum that doesn't include 'approved'/'rejected'
-- This migration adds those values OR alters the column to use text type

-- Option 1: Add new enum values (if using PostgreSQL enum)
-- First check if the enum exists and add values
DO $$
BEGIN
  -- Try to add 'approved' to the enum if it doesn't exist
  BEGIN
    ALTER TYPE verification_status_enum ADD VALUE IF NOT EXISTS 'approved';
  EXCEPTION WHEN others THEN
    NULL; -- Ignore if enum doesn't exist or value already exists
  END;
  
  -- Try to add 'rejected' to the enum if it doesn't exist
  BEGIN
    ALTER TYPE verification_status_enum ADD VALUE IF NOT EXISTS 'rejected';
  EXCEPTION WHEN others THEN
    NULL;
  END;
  
  -- Try to add 'pending' to the enum if it doesn't exist
  BEGIN
    ALTER TYPE verification_status_enum ADD VALUE IF NOT EXISTS 'pending';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- Option 2: If the above doesn't work, alter the column to use TEXT type
-- This is the safest approach - convert enum to text
ALTER TABLE braider_profiles 
  ALTER COLUMN verification_status TYPE TEXT;

-- Set default value
ALTER TABLE braider_profiles 
  ALTER COLUMN verification_status SET DEFAULT 'unverified';

-- Update any NULL values
UPDATE braider_profiles 
SET verification_status = 'unverified' 
WHERE verification_status IS NULL;

-- Also update profile_approved based on verification_status
UPDATE braider_profiles 
SET profile_approved = true 
WHERE verification_status IN ('tier1_verified', 'tier2_verified', 'safety_badge_pro', 'approved');

-- ============================================================================
-- DONE - verification_status column now accepts any text value
-- ============================================================================
