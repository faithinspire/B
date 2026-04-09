-- Add multi-country support to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'NG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN';

-- Create index for country-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_normalized ON profiles(phone_normalized);

-- Add country field to braider_profiles for filtering
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'NG';
CREATE INDEX IF NOT EXISTS idx_braider_profiles_country ON braider_profiles(country);

-- Add payment gateway preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(20) DEFAULT 'paystack';

-- Create a countries table for reference
CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dial_code VARCHAR(5) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_gateway VARCHAR(20) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert supported countries
INSERT INTO countries (code, name, dial_code, currency, payment_gateway, timezone) VALUES
  ('NG', 'Nigeria', '+234', 'NGN', 'paystack', 'Africa/Lagos'),
  ('US', 'United States', '+1', 'USD', 'stripe', 'America/New_York')
ON CONFLICT (code) DO NOTHING;

-- Add comment to explain the schema
COMMENT ON COLUMN profiles.country IS 'ISO 3166-1 alpha-2 country code (e.g., NG, US)';
COMMENT ON COLUMN profiles.phone_normalized IS 'Phone number in international format (e.g., +2348012345678)';
COMMENT ON COLUMN profiles.currency IS 'Currency code for the user (NGN, USD, etc.)';
COMMENT ON COLUMN profiles.payment_gateway IS 'Payment gateway to use (paystack, stripe)';
