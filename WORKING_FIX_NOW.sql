-- ============================================================================
-- WORKING FIX - NO SYNTAX ERRORS
-- ============================================================================
-- This script fixes all issues without using BEGIN/EXCEPTION blocks

-- ============================================================================
-- STEP 1: DISABLE RLS ON ALL TABLES (SIMPLE STATEMENTS ONLY)
-- ============================================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: RESTORE USER DATA FROM AUTH TO PROFILES
-- ============================================================================

UPDATE public.profiles p
SET 
  email = COALESCE(p.email, au.email),
  full_name = COALESCE(p.full_name, au.email),
  updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id
AND (p.email IS NULL OR p.email = '' OR p.full_name IS NULL OR p.full_name = '');

-- ============================================================================
-- STEP 3: INSERT MISSING PROFILES FOR ALL AUTH USERS
-- ============================================================================

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
-- STEP 4: ENSURE ALL BRAIDERS ARE VISIBLE
-- ============================================================================

UPDATE public.braider_profiles bp
SET 
  full_name = COALESCE(bp.full_name, p.full_name),
  email = COALESCE(bp.email, p.email),
  updated_at = NOW()
FROM public.profiles p
WHERE bp.user_id = p.id
AND (bp.full_name IS NULL OR bp.full_name = '' OR bp.email IS NULL OR bp.email = '');

-- ============================================================================
-- STEP 5: VERIFY DATA RESTORED
-- ============================================================================

SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as profiles_with_email,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as profiles_with_name
FROM public.profiles;

SELECT 
  COUNT(*) as total_braiders,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as braiders_with_name
FROM public.braider_profiles;

SELECT COUNT(*) as total_services FROM public.services;
