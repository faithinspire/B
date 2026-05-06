-- ============================================================================
-- FIX USER NAMES - FINAL WORKING VERSION
-- ============================================================================
-- This script populates user names and emails in profiles and braider_profiles
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: ENSURE ALL AUTH USERS HAVE PROFILES
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.email, 'User') as full_name,
  'customer' as role,
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: UPDATE PROFILES - FILL IN MISSING NAMES
-- ============================================================================

UPDATE public.profiles p
SET 
  full_name = COALESCE(NULLIF(p.full_name, ''), (SELECT email FROM auth.users WHERE id = p.id), 'User'),
  email = COALESCE(NULLIF(p.email, ''), (SELECT email FROM auth.users WHERE id = p.id)),
  updated_at = NOW()
WHERE p.full_name IS NULL OR p.full_name = '' OR p.email IS NULL OR p.email = '';

-- ============================================================================
-- STEP 3: UPDATE BRAIDER_PROFILES - FILL IN MISSING NAMES AND EMAILS
-- ============================================================================

UPDATE public.braider_profiles bp
SET 
  full_name = COALESCE(
    NULLIF(bp.full_name, ''),
    (SELECT full_name FROM public.profiles WHERE id = bp.user_id),
    (SELECT email FROM auth.users WHERE id = bp.user_id),
    'Braider'
  ),
  email = COALESCE(
    NULLIF(bp.email, ''),
    (SELECT email FROM public.profiles WHERE id = bp.user_id),
    (SELECT email FROM auth.users WHERE id = bp.user_id)
  ),
  updated_at = NOW()
WHERE bp.full_name IS NULL OR bp.full_name = '' OR bp.email IS NULL OR bp.email = '';

-- ============================================================================
-- VERIFICATION - SHOW RESULTS
-- ============================================================================

-- Show all profiles with names
SELECT 
  'PROFILES' as source,
  COUNT(*) as total,
  SUM(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 ELSE 0 END) as missing_names,
  SUM(CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END) as missing_emails
FROM public.profiles

UNION ALL

-- Show all braider profiles with names
SELECT 
  'BRAIDER_PROFILES' as source,
  COUNT(*) as total,
  SUM(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 ELSE 0 END) as missing_names,
  SUM(CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END) as missing_emails
FROM public.braider_profiles;

-- Show sample of profiles
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- Show sample of braider profiles
SELECT 
  id,
  user_id,
  full_name,
  email,
  verification_status
FROM public.braider_profiles
ORDER BY created_at DESC
LIMIT 10;
