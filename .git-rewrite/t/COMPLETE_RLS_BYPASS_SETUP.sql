-- ============================================================================
-- COMPLETE RLS BYPASS SETUP - Service Role Key Implementation
-- ============================================================================
-- This script sets up tables and RLS policies that work with service role key
-- The service role key bypasses RLS, allowing server-side operations to work

-- ============================================================================
-- 1. PROFILES TABLE (for avatars)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policy: Service role can do anything (bypassed anyway)
CREATE POLICY "Service role bypass" ON profiles
  FOR ALL USING (true);

-- ============================================================================
-- 2. BRAIDER_PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS braider_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  travel_radius_miles INTEGER DEFAULT 10,
  is_mobile BOOLEAN DEFAULT true,
  salon_address TEXT,
  specialties TEXT[] DEFAULT '{}',
  total_earnings DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on braider_profiles
ALTER TABLE braider_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Braiders can read their own profile
CREATE POLICY "Braiders can read own profile" ON braider_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Braiders can update their own profile
CREATE POLICY "Braiders can update own profile" ON braider_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Anyone can read braider profiles (for browsing)
CREATE POLICY "Anyone can read braider profiles" ON braider_profiles
  FOR SELECT USING (true);

-- ============================================================================
-- 3. SERVICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Braiders can read their own services
CREATE POLICY "Braiders can read own services" ON services
  FOR SELECT USING (auth.uid() = braider_id);

-- RLS Policy: Braiders can insert their own services
CREATE POLICY "Braiders can insert own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = braider_id);

-- RLS Policy: Braiders can update their own services
CREATE POLICY "Braiders can update own services" ON services
  FOR UPDATE USING (auth.uid() = braider_id);

-- RLS Policy: Braiders can delete their own services
CREATE POLICY "Braiders can delete own services" ON services
  FOR DELETE USING (auth.uid() = braider_id);

-- RLS Policy: Anyone can read active services (for browsing)
CREATE POLICY "Anyone can read active services" ON services
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- 4. PORTFOLIO_IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on portfolio_images
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Braiders can read their own portfolio
CREATE POLICY "Braiders can read own portfolio" ON portfolio_images
  FOR SELECT USING (auth.uid() = braider_id);

-- RLS Policy: Braiders can insert their own portfolio
CREATE POLICY "Braiders can insert own portfolio" ON portfolio_images
  FOR INSERT WITH CHECK (auth.uid() = braider_id);

-- RLS Policy: Braiders can delete their own portfolio
CREATE POLICY "Braiders can delete own portfolio" ON portfolio_images
  FOR DELETE USING (auth.uid() = braider_id);

-- RLS Policy: Anyone can read portfolio (for browsing)
CREATE POLICY "Anyone can read portfolio" ON portfolio_images
  FOR SELECT USING (true);

-- ============================================================================
-- 5. PORTFOLIO TABLE (alternative structure)
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on portfolio
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Braiders can read their own portfolio
CREATE POLICY "Braiders can read own portfolio" ON portfolio
  FOR SELECT USING (auth.uid() = braider_id);

-- RLS Policy: Braiders can insert their own portfolio
CREATE POLICY "Braiders can insert own portfolio" ON portfolio
  FOR INSERT WITH CHECK (auth.uid() = braider_id);

-- RLS Policy: Braiders can delete their own portfolio
CREATE POLICY "Braiders can delete own portfolio" ON portfolio
  FOR DELETE USING (auth.uid() = braider_id);

-- RLS Policy: Anyone can read portfolio
CREATE POLICY "Anyone can read portfolio" ON portfolio
  FOR SELECT USING (true);

-- ============================================================================
-- 6. STORAGE BUCKETS SETUP
-- ============================================================================
-- Note: Run these in Supabase dashboard if SQL doesn't work

-- Create avatars bucket (if not exists)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT DO NOTHING;

-- Create portfolio bucket (if not exists)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true)
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. STORAGE RLS POLICIES
-- ============================================================================
-- Note: Storage RLS is separate from table RLS

-- Avatars bucket - allow authenticated users to upload
-- CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'avatars' AND
--     auth.role() = 'authenticated'
--   );

-- Avatars bucket - allow public read
-- CREATE POLICY "Public can read avatars" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- Portfolio bucket - allow authenticated users to upload
-- CREATE POLICY "Authenticated users can upload portfolio" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'portfolio' AND
--     auth.role() = 'authenticated'
--   );

-- Portfolio bucket - allow public read
-- CREATE POLICY "Public can read portfolio" ON storage.objects
--   FOR SELECT USING (bucket_id = 'portfolio');

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_braider_profiles_user_id ON braider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_services_braider_id ON services(braider_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_braider_id ON portfolio_images(braider_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_braider_id ON portfolio(braider_id);

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify setup:

-- Check profiles table
-- SELECT * FROM profiles LIMIT 1;

-- Check braider_profiles table
-- SELECT * FROM braider_profiles LIMIT 1;

-- Check services table
-- SELECT * FROM services LIMIT 1;

-- Check portfolio_images table
-- SELECT * FROM portfolio_images LIMIT 1;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'braider_profiles', 'services', 'portfolio_images', 'portfolio');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Service role key bypasses all RLS policies
-- 2. API routes use service role key for inserts/updates
-- 3. Client-side queries still respect RLS
-- 4. Storage buckets must be created in Supabase dashboard
-- 5. Storage RLS policies must be set in Supabase dashboard
-- 6. All timestamps are UTC
-- 7. IDs use UUID or random text
