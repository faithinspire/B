-- ============================================================================
-- SYSTEM AUDIT HARD FIX - All 7 Critical Issues
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. COUNTRY FIELD: Ensure profiles table has country column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_gateway TEXT;

-- 2. BRAIDER PROFILES: Ensure country, instagram, tiktok columns exist
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS status_text TEXT;

-- 3. BOOKINGS: Ensure braider_country and currency columns exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS braider_country TEXT DEFAULT 'NG';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';

-- 4. CONVERSATIONS: Ensure all required columns exist
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS braider_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 5. MESSAGES: Ensure read and sender_role columns exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'customer';

-- 6. MARKETPLACE PRODUCTS: Ensure all required columns exist
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'NG';
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS location_state TEXT;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT 0;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 7. PASSWORD RESET TOKENS TABLE
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BRAIDER STATUS TABLES
CREATE TABLE IF NOT EXISTS braider_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  view_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS status_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id UUID NOT NULL REFERENCES braider_status(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FIX COUNTRY MISCLASSIFICATION: Update users who signed up with US country
-- This corrects existing data where country was defaulted to 'NG' incorrectly
-- Only update if metadata indicates US
UPDATE profiles
SET country = 'US'
WHERE country IS NULL
  AND (
    raw_user_meta_data->>'country' = 'US'
    OR raw_user_meta_data->>'phone_country' = 'US'
  );

-- Also fix braider_profiles country from profiles
UPDATE braider_profiles bp
SET country = p.country
FROM profiles p
WHERE bp.user_id = p.id
  AND p.country IS NOT NULL
  AND (bp.country IS NULL OR bp.country = 'NG')
  AND p.country = 'US';

-- 10. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_country ON braider_profiles(country);
CREATE INDEX IF NOT EXISTS idx_bookings_braider_country ON bookings(braider_country);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_braider_id ON conversations(braider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_country_code ON marketplace_products(country_code);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_braider_status_braider_id ON braider_status(braider_id);
CREATE INDEX IF NOT EXISTS idx_braider_status_expires_at ON braider_status(expires_at);

-- 11. DISABLE RLS on new tables
ALTER TABLE braider_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- 12. GRANT permissions
GRANT ALL ON braider_status TO authenticated, service_role;
GRANT ALL ON status_views TO authenticated, service_role;
GRANT ALL ON password_reset_tokens TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to check)
-- ============================================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'braider_profiles' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conversations' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' ORDER BY ordinal_position;
-- SELECT COUNT(*) FROM marketplace_products;
-- SELECT country, COUNT(*) FROM profiles GROUP BY country;
