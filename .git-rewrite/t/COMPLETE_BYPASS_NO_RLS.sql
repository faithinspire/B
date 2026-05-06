-- ============================================================================
-- COMPLETE BYPASS - NO RLS, AUTO-SYNC EVERYTHING
-- ============================================================================
-- This script DISABLES all RLS and creates tables that auto-sync on signup

-- ============================================================================
-- 1. DISABLE ALL RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP ALL EXISTING RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Braiders can read own profile" ON braider_profiles;
DROP POLICY IF EXISTS "Braiders can update own profile" ON braider_profiles;
DROP POLICY IF EXISTS "Anyone can read braider profiles" ON braider_profiles;
DROP POLICY IF EXISTS "Braiders can read own services" ON services;
DROP POLICY IF EXISTS "Braiders can insert own services" ON services;
DROP POLICY IF EXISTS "Braiders can update own services" ON services;
DROP POLICY IF EXISTS "Braiders can delete own services" ON services;
DROP POLICY IF EXISTS "Anyone can read active services" ON services;
DROP POLICY IF EXISTS "Braiders can read own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Braiders can insert own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Braiders can delete own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Anyone can read portfolio" ON portfolio;
DROP POLICY IF EXISTS "Customers can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Braiders can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Braiders can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Customers can insert payments" ON payments;
DROP POLICY IF EXISTS "Braiders can read own payouts" ON payouts;
DROP POLICY IF EXISTS "Braiders can insert payouts" ON payouts;
DROP POLICY IF EXISTS "Anyone can read ratings" ON ratings;
DROP POLICY IF EXISTS "Users can insert ratings" ON ratings;
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can read notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete favorites" ON favorites;
DROP POLICY IF EXISTS "Users can read own location" ON location_tracking;
DROP POLICY IF EXISTS "Users can insert location" ON location_tracking;
DROP POLICY IF EXISTS "Braiders can read own sessions" ON location_tracking_sessions;
DROP POLICY IF EXISTS "Braiders can read own transactions" ON transactions;

-- ============================================================================
-- 3. CREATE AUTO-SYNC TRIGGER FOR PROFILES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile record
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. CREATE AUTO-SYNC TRIGGER FOR BRAIDER_PROFILES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_braider()
RETURNS TRIGGER AS $$
BEGIN
  -- Create braider_profiles record if user_id is set
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.braider_profiles (
      id, user_id, full_name, email, avatar_url, bio, experience_years,
      rating_avg, rating_count, verification_status, travel_radius_miles,
      is_mobile, salon_address, specialties, total_earnings, available_balance,
      created_at, updated_at
    )
    VALUES (
      COALESCE(NEW.id, 'braider_' || NEW.user_id),
      NEW.user_id,
      COALESCE(NEW.full_name, 'Braider'),
      COALESCE(NEW.email, ''),
      NULL,
      COALESCE(NEW.bio, ''),
      COALESCE(NEW.experience_years, 0),
      5.0,
      0,
      'unverified',
      10,
      true,
      NULL,
      '{}',
      0,
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      bio = EXCLUDED.bio,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_braider_profile_created ON braider_profiles;

-- Create trigger
CREATE TRIGGER on_braider_profile_created
  AFTER INSERT ON braider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_braider();

-- ============================================================================
-- 5. ALLOW ALL OPERATIONS (NO RLS)
-- ============================================================================
-- All tables now have RLS disabled, so all operations are allowed

-- ============================================================================
-- 6. VERIFY RLS IS DISABLED
-- ============================================================================
-- Run this to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
--   'profiles', 'braider_profiles', 'services', 'portfolio', 'bookings',
--   'payments', 'payouts', 'ratings', 'messages', 'conversations',
--   'notifications', 'favorites', 'location_tracking', 'location_tracking_sessions', 'transactions'
-- );
-- All should show rowsecurity = false
