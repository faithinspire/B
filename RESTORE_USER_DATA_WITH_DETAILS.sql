-- ============================================================================
-- RESTORE ALL USER DATA WITH COMPLETE DETAILS
-- ============================================================================
-- This restores user data with REAL NAMES, EMAILS, and CONTACT INFO
-- Not UUIDs - actual user details for admin management

-- ============================================================================
-- STEP 1: ENSURE ALL AUTH USERS ARE IN PROFILES TABLE
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    (au.user_metadata->>'full_name'),
    (au.user_metadata->>'name'),
    au.email
  ) as full_name,
  COALESCE(
    (au.user_metadata->>'role'),
    'customer'
  ) as role,
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- ============================================================================
-- STEP 2: UPDATE PROFILES WITH MISSING DATA FROM AUTH USERS
-- ============================================================================

UPDATE public.profiles p
SET 
  email = COALESCE(p.email, au.email),
  full_name = COALESCE(
    NULLIF(p.full_name, ''),
    (au.user_metadata->>'full_name'),
    (au.user_metadata->>'name'),
    au.email
  ),
  role = COALESCE(
    NULLIF(p.role, ''),
    (au.user_metadata->>'role'),
    'customer'
  ),
  updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id
AND (p.email IS NULL OR p.email = '' 
  OR p.full_name IS NULL OR p.full_name = '');

-- ============================================================================
-- STEP 3: ENSURE BRAIDER PROFILES HAVE COMPLETE CONTACT INFO
-- ============================================================================

UPDATE public.braider_profiles bp
SET 
  full_name = COALESCE(
    NULLIF(bp.full_name, ''),
    (SELECT full_name FROM public.profiles WHERE id = bp.user_id),
    (SELECT email FROM auth.users WHERE id = bp.user_id)
  ),
  email = COALESCE(
    NULLIF(bp.email, ''),
    (SELECT email FROM public.profiles WHERE id = bp.user_id),
    (SELECT email FROM auth.users WHERE id = bp.user_id)
  ),
  updated_at = NOW()
WHERE full_name IS NULL OR full_name = '' OR email IS NULL OR email = '';

-- ============================================================================
-- STEP 4: VERIFY ALL DATA IS RESTORED - RUN THIS TO CHECK
-- ============================================================================

-- Show all users with their details
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  CASE WHEN bp.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as is_braider,
  bp.full_name as braider_name,
  bp.email as braider_email,
  bp.verification_status,
  bp.rating_avg as braider_rating
FROM public.profiles p
LEFT JOIN public.braider_profiles bp ON p.id = bp.user_id
ORDER BY p.created_at DESC;

-- ============================================================================
-- STEP 5: COUNT SUMMARY
-- ============================================================================

SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
  SUM(CASE WHEN role = 'braider' THEN 1 ELSE 0 END) as braiders,
  SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers
FROM public.profiles;
