-- Add missing columns to braider_profiles table for braider signup
-- This fixes the "COULD NOT FIND THE ID_DOCUMENT_URL COLUMN" error

ALTER TABLE braider_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,
ADD COLUMN IF NOT EXISTS id_type TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_braider_profiles_phone ON braider_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_state ON braider_profiles(state);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_city ON braider_profiles(city);
