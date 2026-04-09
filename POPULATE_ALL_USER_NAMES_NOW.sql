-- ============================================================================
-- POPULATE ALL USER NAMES - PROFILES AND BRAIDER_PROFILES ONLY
-- ============================================================================
-- This populates profiles and braider_profiles with real names and emails

-- ============================================================================
-- STEP 1: POPULATE PROFILES TABLE WITH ALL AUTH USERS
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(email, 'User') as full_name,
  'customer' as role,
  created_at,
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = auth.users.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
  updated_at = NOW();

-- ============================================================================
-- STEP 2: UPDATE PROFILES WITH BETTER NAMES
-- ============================================================================

UPDATE public.profiles
SET 
  full_name = COALESCE(NULLIF(full_name, ''), email, 'User'),
  updated_at = NOW()
WHERE full_name IS NULL OR full_name = '';

-- ============================================================================
-- STEP 3: POPULATE BRAIDER_PROFILES TABLE WITH NAMES AND EMAILS
-- ============================================================================

UPDATE public.braider_profiles
SET 
  full_name = COALESCE(
    NULLIF(full_name, ''),
    (SELECT full_name FROM public.profiles WHERE id = braider_profiles.user_id),
    (SELECT email FROM auth.users WHERE id = braider_profiles.user_id),
    'Braider'
  ),
  email = COALESCE(
    NULLIF(email, ''),
    (SELECT email FROM public.profiles WHERE id = braider_profiles.user_id),
    (SELECT email FROM auth.users WHERE id = braider_profiles.user_id)
  )
WHERE full_name IS NULL OR full_name = '' OR email IS NULL OR email = '';

-- ============================================================================
-- STEP 4: VERIFY - SHOW ALL PROFILES
-- ============================================================================

SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 5: VERIFY - SHOW ALL BRAIDER_PROFILES
-- ============================================================================

SELECT 
  id,
  user_id,
  full_name,
  email,
  bio,
  verification_status
FROM public.braider_profiles
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 6: SUMMARY
-- ============================================================================

SELECT 
  'PROFILES' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 ELSE 0 END) as empty_names,
  SUM(CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END) as empty_emails
FROM public.profiles

UNION ALL

SELECT 
  'BRAIDER_PROFILES' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 ELSE 0 END) as empty_names,
  SUM(CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END) as empty_emails
FROM public.braider_profiles;
