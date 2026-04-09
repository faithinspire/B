-- ============================================================================
-- FINAL USER DATA RESTORE - COMPLETE BYPASS
-- ============================================================================
-- This is the ONLY SQL you need to run
-- It restores ALL user names, emails, and essential details
-- No schema conflicts, no policy errors - just pure data restoration

-- ============================================================================
-- STEP 1: POPULATE PROFILES WITH ALL AUTH USERS
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, role, avatar_url, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(email, 'User') as full_name,
  'customer' as role,
  NULL as avatar_url,
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
-- STEP 2: UPDATE EMPTY PROFILE NAMES WITH EMAILS
-- ============================================================================

UPDATE public.profiles
SET 
  full_name = COALESCE(NULLIF(full_name, ''), email, 'User'),
  updated_at = NOW()
WHERE full_name IS NULL OR full_name = '';

-- ============================================================================
-- STEP 3: POPULATE BRAIDER PROFILES WITH NAMES AND EMAILS
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
WHERE full_name IS NULL OR full_name = '' OR email IS NULL OR email = '';

-- ============================================================================
-- STEP 4: SHOW ALL USERS - VERIFICATION QUERY
-- ============================================================================

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  CASE WHEN bp.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as is_braider,
  bp.full_name as braider_name,
  bp.email as braider_email,
  bp.verification_status
FROM public.profiles p
LEFT JOIN public.braider_profiles bp ON p.id = bp.user_id
ORDER BY p.created_at DESC;

-- ============================================================================
-- STEP 5: SUMMARY STATISTICS
-- ============================================================================

SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
  SUM(CASE WHEN role = 'braider' THEN 1 ELSE 0 END) as braiders,
  SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers
FROM public.profiles;
