-- Add phone_country column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_country VARCHAR(2);

-- Create index for phone_country queries
CREATE INDEX IF NOT EXISTS idx_profiles_phone_country ON profiles(phone_country);

-- Update existing records with default country if phone_country is null
UPDATE profiles SET phone_country = 'NG' WHERE phone_country IS NULL;
