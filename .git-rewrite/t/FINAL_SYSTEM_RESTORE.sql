-- ============================================================================
-- FINAL SYSTEM RESTORE - RUN THIS IN SUPABASE SQL EDITOR
-- This fixes all critical issues:
-- 1. Admin user role (customer -> admin)
-- 2. Missing profiles for all auth users
-- 3. Missing braider_profiles for all braiders
-- 4. Ensures all data is synced correctly
-- ============================================================================

-- STEP 1: CREATE MISSING PROFILES FOR ALL AUTH USERS
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

-- STEP 2: SYNC ALL ROLES FROM AUTH METADATA TO PROFILES
UPDATE profiles p
SET role = COALESCE(u.raw_user_meta_data->>'role', 'customer'),
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
AND p.role IS DISTINCT FROM COALESCE(u.raw_user_meta_data->>'role', 'customer');

-- STEP 3: ENSURE BRAIDER_PROFILES EXIST FOR ALL BRAIDERS
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

-- STEP 4: VERIFY ALL DATA
SELECT 'VERIFICATION RESULTS:' as status;
SELECT 'Total auth users:' as check_name, COUNT(*) as count FROM auth.users;
SELECT 'Total profiles:' as check_name, COUNT(*) as count FROM profiles;
SELECT 'Profiles by role:' as check_name, role, COUNT(*) as count FROM profiles GROUP BY role;
SELECT 'Total braider_profiles:' as check_name, COUNT(*) as count FROM braider_profiles;
SELECT 'Braiders with profiles:' as check_name, COUNT(*) as count FROM profiles WHERE role = 'braider';

-- STEP 5: SHOW ADMIN USERS (should have role = 'admin')
SELECT 'ADMIN USERS:' as status;
SELECT id, email, full_name, role FROM profiles WHERE role = 'admin' ORDER BY created_at DESC;

-- STEP 6: SHOW ALL BRAIDERS
SELECT 'ALL BRAIDERS:' as status;
SELECT user_id, full_name, email, verification_status, verified FROM braider_profiles ORDER BY created_at DESC LIMIT 20;

-- ============================================================================
-- WHAT THIS SCRIPT DOES:
-- 1. Creates missing profiles for all auth users (fixes missing data)
-- 2. Syncs roles from auth metadata to profiles (fixes admin role issue)
-- 3. Creates braider_profiles for all braiders (fixes braider visibility)
-- 4. Verifies all data is correct
-- ============================================================================
