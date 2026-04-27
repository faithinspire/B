-- ============================================================================
-- MIGRATION: Add phone login support and payment gateway routing
-- ============================================================================
-- This migration adds:
-- 1. Phone field to profiles table for phone-based login
-- 2. Phone country field for international phone support
-- 3. Payment method field to bookings for currency-aware routing
-- 4. Forgot password tokens table for password recovery

-- ============================================================================
-- 1. Add phone fields to profiles table
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_country TEXT DEFAULT 'NG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Create unique index on phone for phone-based login
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_phone_country ON profiles(phone_country);

-- ============================================================================
-- 2. Add payment method field to bookings table
-- ============================================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);

-- ============================================================================
-- 3. Create password reset tokens table
-- ============================================================================
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own reset tokens" ON password_reset_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- 4. Create email verification table for phone login
-- ============================================================================
DROP TABLE IF EXISTS phone_login_mappings CASCADE;
CREATE TABLE phone_login_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  phone_country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone, phone_country)
);

ALTER TABLE phone_login_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own phone mappings" ON phone_login_mappings FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_phone_login_mappings_user_id ON phone_login_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_login_mappings_phone ON phone_login_mappings(phone, phone_country);

-- ============================================================================
-- 5. Add country field to profiles if not exists
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'NG';
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);

-- ============================================================================
-- 5. Add soft delete flag to profiles
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
