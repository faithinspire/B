-- Add profession_type column to braider_profiles (barber or braider)
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS profession_type TEXT DEFAULT 'braider';

-- Add social media links
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Add booking count (denormalized for performance)
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;

-- Add portfolio media (images/videos) stored as JSONB array
-- Each item: { url, type: 'image'|'video', title, description, created_at }
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS portfolio_media JSONB DEFAULT '[]'::jsonb;

-- Update existing braiders: detect barbers from specialization prefix
UPDATE braider_profiles 
SET profession_type = 'barber'
WHERE specialization LIKE 'barber:%' AND profession_type IS NULL OR profession_type = 'braider';

-- Fix specialization for barbers (remove prefix)
UPDATE braider_profiles
SET specialization = SUBSTRING(specialization FROM 8)
WHERE specialization LIKE 'barber:%';

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_braider_profiles_profession_type ON braider_profiles(profession_type);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_country ON braider_profiles(country);
