-- ============================================================================
-- COMPLETE SYSTEM RESTORE — RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- STEP 1: CHECK ALL USERS AND THEIR PROFILES
SELECT 'CHECKING USERS' as step;
SELECT id, email, role FROM profiles ORDER BY created_at DESC;

-- STEP 2: FIX ADMIN ROLE (NO UUID PLACEHOLDER)
-- This will update ALL users with 'admin' role in auth to have 'admin' in profiles
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE email IN (
  SELECT email FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'admin'
) AND role != 'admin';

-- STEP 3: FIX BRAIDER ROLES
UPDATE profiles 
SET role = 'braider', updated_at = NOW()
WHERE email IN (
  SELECT email FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'braider'
) AND role != 'braider';

-- STEP 4: FIX CUSTOMER ROLES
UPDATE profiles 
SET role = 'customer', updated_at = NOW()
WHERE email IN (
  SELECT email FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'customer'
) AND role != 'customer';

-- STEP 5: CREATE MISSING PROFILES FOR USERS WITHOUT PROFILES
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

-- STEP 6: VERIFY ALL USERS NOW HAVE PROFILES
SELECT 'VERIFICATION: All users with profiles' as step;
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as users_without_profiles FROM auth.users WHERE id NOT IN (SELECT id FROM profiles);

-- STEP 7: SHOW ALL USERS AND THEIR ROLES
SELECT 'FINAL USER LIST' as step;
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  p.avatar_url
FROM profiles p
ORDER BY p.role, p.email;

-- STEP 8: VERIFY MESSAGES TABLE HAS ALL REQUIRED COLUMNS
SELECT 'CHECKING MESSAGES TABLE' as step;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- STEP 9: VERIFY CONVERSATIONS TABLE HAS ALL REQUIRED COLUMNS
SELECT 'CHECKING CONVERSATIONS TABLE' as step;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'conversations' 
ORDER BY ordinal_position;

-- STEP 10: VERIFY LOCATION_TRACKING TABLE HAS ALL REQUIRED COLUMNS
SELECT 'CHECKING LOCATION_TRACKING TABLE' as step;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'location_tracking' 
ORDER BY ordinal_position;

-- STEP 11: VERIFY RLS IS DISABLED ON ALL TABLES
SELECT 'CHECKING RLS STATUS' as step;
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'conversations', 'location_tracking', 'notifications', 'profiles', 'bookings')
ORDER BY tablename;

-- STEP 12: VERIFY REALTIME IS ENABLED
SELECT 'CHECKING REALTIME' as step;
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This script will:
-- 1. Show all users and profiles
-- 2. Fix admin/braider/customer roles based on auth metadata
-- 3. Create missing profiles for users without them
-- 4. Verify all tables have required columns
-- 5. Verify RLS is disabled
-- 6. Verify Realtime is enabled
-- ============================================================================
