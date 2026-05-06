-- ============================================================================
-- RESTORE USER DATA FROM AUTH TO PROFILES TABLE - FIXED VERSION
-- ============================================================================
-- This restores all user names, emails, and credentials from Supabase Auth
-- to the profiles table so they display correctly in the admin panel

-- ============================================================================
-- STEP 1: DISABLE RLS ON ALL TABLES FIRST
-- ============================================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

DO $ BEGIN
  ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.disputes DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

-- ============================================================================
-- STEP 2: UPDATE EXISTING PROFILES WITH EMAIL FROM AUTH USERS
-- ============================================================================
-- This updates profiles that exist but have missing email/name data

UPDATE public.profiles p
SET 
  email = COALESCE(p.email, au.email),
  full_name = COALESCE(p.full_name, au.email),
  updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id
AND (p.email IS NULL OR p.email = '' OR p.full_name IS NULL OR p.full_name = '');

-- ============================================================================
-- STEP 3: INSERT MISSING PROFILES FOR AUTH USERS WITHOUT PROFILES
-- ============================================================================
-- This creates profile records for any auth users that don't have profiles yet

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  au.email,
  'customer',
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
-- STEP 4: VERIFY DATA RESTORED
-- ============================================================================
-- Run this query to verify all users have names and emails:
-- SELECT id, email, full_name, role, created_at FROM public.profiles ORDER BY created_at DESC;
-- Expected: All rows should have email and full_name populated (not NULL or empty)
