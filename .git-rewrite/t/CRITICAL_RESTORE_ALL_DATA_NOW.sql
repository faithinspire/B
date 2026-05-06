-- ============================================================================
-- CRITICAL: RESTORE ALL DATA AND FIX SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: VERIFY ALL USERS HAVE PROFILES
SELECT 'STEP 1: Checking users and profiles' as step;
SELECT 
  COUNT(DISTINCT u.id) as total_auth_users,
  COUNT(DISTINCT p.id) as total_profiles,
  COUNT(DISTINCT u.id) FILTER (WHERE u.id NOT IN (SELECT id FROM profiles)) as users_without_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

-- STEP 2: CREATE MISSING PROFILES FOR ALL AUTH USERS
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  COALESCE(u.raw_user_meta_data->>'role', 'customer'),
  u.created_at,
  NOW()
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- STEP 3: SYNC ALL ROLES FROM AUTH METADATA TO PROFILES
UPDATE profiles p
SET role = COALESCE(u.raw_user_meta_data->>'role', 'customer'),
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
AND p.role IS DISTINCT FROM COALESCE(u.raw_user_meta_data->>'role', 'customer');

-- STEP 4: VERIFY ALL ROLES ARE CORRECT
SELECT 'STEP 4: Verifying roles' as step;
SELECT role, COUNT(*) as count FROM profiles GROUP BY role ORDER BY role;

-- STEP 5: ENSURE BRAIDER_PROFILES EXIST FOR ALL BRAIDERS
INSERT INTO braider_profiles (user_id, full_name, email, bio, rating_avg, rating_count, verification_status, verified, created_at, updated_at)
SELECT 
  p.id,
  p.full_name,
  p.email,
  COALESCE(p.bio, ''),
  0,
  0,
  'pending',
  false,
  p.created_at,
  NOW()
FROM profiles p
WHERE p.role = 'braider'
AND p.id NOT IN (SELECT user_id FROM braider_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- STEP 6: VERIFY BRAIDERS ARE VISIBLE
SELECT 'STEP 6: Checking braiders' as step;
SELECT COUNT(*) as total_braiders FROM braider_profiles;
SELECT COUNT(*) as braiders_with_profiles FROM profiles WHERE role = 'braider';

-- STEP 7: SHOW ALL USERS
SELECT 'STEP 7: All users' as step;
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
ORDER BY p.role, p.email;

-- STEP 8: SHOW ALL BRAIDERS
SELECT 'STEP 8: All braiders' as step;
SELECT 
  bp.user_id,
  bp.full_name,
  bp.email,
  bp.bio,
  bp.rating_avg,
  bp.verification_status,
  bp.verified
FROM braider_profiles bp
ORDER BY bp.created_at DESC;

-- STEP 9: VERIFY TABLES HAVE REQUIRED COLUMNS
SELECT 'STEP 9: Checking table schemas' as step;

-- Check profiles table
SELECT 'profiles table columns:' as table_name;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Check braider_profiles table
SELECT 'braider_profiles table columns:' as table_name;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'braider_profiles' ORDER BY ordinal_position;

-- STEP 10: VERIFY RLS IS DISABLED
SELECT 'STEP 10: Checking RLS status' as step;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'braider_profiles', 'messages', 'conversations', 'location_tracking')
ORDER BY tablename;

-- STEP 11: VERIFY REALTIME IS ENABLED
SELECT 'STEP 11: Checking Realtime' as step;
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- STEP 12: FINAL SUMMARY
SELECT 'STEP 12: FINAL SUMMARY' as step;
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'braider') as braider_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer') as customer_count,
  (SELECT COUNT(*) FROM braider_profiles) as braider_profiles_count;

-- ============================================================================
-- WHAT THIS SCRIPT DOES:
-- 1. Creates missing profiles for all auth users
-- 2. Syncs roles from auth metadata to profiles
-- 3. Creates braider_profiles for all braiders
-- 4. Verifies all data is present
-- 5. Checks RLS is disabled
-- 6. Checks Realtime is enabled
-- ============================================================================
