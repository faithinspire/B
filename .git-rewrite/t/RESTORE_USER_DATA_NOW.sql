-- ============================================================================
-- RESTORE USER DATA FROM AUTH TO PROFILES TABLE
-- ============================================================================
-- This restores all user names, emails, and credentials from Supabase Auth
-- to the profiles table so they display correctly in the admin panel

-- ============================================================================
-- STEP 1: UPDATE PROFILES WITH DATA FROM AUTH USERS
-- ============================================================================

UPDATE public.profiles p
SET 
  email = COALESCE(p.email, au.email),
  full_name = COALESCE(p.full_name, au.user_metadata->>'full_name', au.email),
  updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id
AND (p.email IS NULL OR p.email = '' OR p.full_name IS NULL OR p.full_name = '');

-- ============================================================================
-- STEP 2: INSERT MISSING PROFILES FOR AUTH USERS WITHOUT PROFILES
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.user_metadata->>'full_name', au.email),
  COALESCE(au.user_metadata->>'role', 'customer'),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: VERIFY DATA RESTORED
-- ============================================================================

-- Run this query to verify all users have names and emails:
-- SELECT id, email, full_name, role, created_at FROM public.profiles ORDER BY created_at DESC;

-- Expected: All rows should have email and full_name populated (not NULL or empty)
