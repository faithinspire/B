-- ============================================================================
-- CRITICAL: FIX BRAIDERS VISIBILITY - RUN THIS IMMEDIATELY IN SUPABASE
-- This populates braider_profiles table so braiders are visible everywhere
-- ============================================================================

-- STEP 1: VERIFY CURRENT STATE
SELECT 'STEP 1: Current State' as step;
SELECT 'Auth users:' as check_name, COUNT(*) as count FROM auth.users;
SELECT 'Profiles:' as check_name, COUNT(*) as count FROM profiles;
SELECT 'Profiles by role:' as check_name, role, COUNT(*) as count FROM profiles GROUP BY role;
SELECT 'Braider profiles:' as check_name, COUNT(*) as count FROM braider_profiles;

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

-- STEP 4: CREATE BRAIDER_PROFILES FOR ALL BRAIDERS (CRITICAL FOR VISIBILITY)
INSERT INTO braider_profiles (
  user_id, 
  full_name, 
  email, 
  bio, 
  rating_avg, 
  rating_count, 
  verification_status, 
  verified, 
  created_at, 
  updated_at
)
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

-- STEP 5: VERIFY BRAIDERS ARE NOW VISIBLE
SELECT 'STEP 5: Braiders Now Visible' as step;
SELECT 'Total braiders in profiles:' as check_name, COUNT(*) as count FROM profiles WHERE role = 'braider';
SELECT 'Total braider_profiles:' as check_name, COUNT(*) as count FROM braider_profiles;
SELECT 'Braiders ready for display:' as check_name, COUNT(*) as count FROM braider_profiles WHERE verification_status IN ('pending', 'approved');

-- STEP 6: SHOW ALL BRAIDERS
SELECT 'STEP 6: All Braiders' as step;
SELECT 
  user_id,
  full_name,
  email,
  bio,
  rating_avg,
  verification_status,
  verified,
  created_at
FROM braider_profiles
ORDER BY created_at DESC;

-- STEP 7: VERIFY ADMIN USERS
SELECT 'STEP 7: Admin Users' as step;
SELECT 
  id,
  email,
  full_name,
  role
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- STEP 8: FINAL SUMMARY
SELECT 'STEP 8: FINAL SUMMARY' as step;
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'braider') as braider_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer') as customer_count,
  (SELECT COUNT(*) FROM braider_profiles) as braider_profiles_count,
  (SELECT COUNT(*) FROM braider_profiles WHERE verification_status = 'approved') as verified_braiders;

-- ============================================================================
-- WHAT THIS SCRIPT DOES:
-- 1. Creates missing profiles for all auth users
-- 2. Syncs roles from auth metadata to profiles
-- 3. CREATES BRAIDER_PROFILES FOR ALL BRAIDERS (CRITICAL!)
-- 4. Verifies all data is correct
-- 5. Shows all braiders ready for display
-- ============================================================================
