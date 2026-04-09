-- ============================================================================
-- RESTORE ALL USER DATA - COMPLETE FIX
-- ============================================================================
-- This will populate the profiles table with ALL user data from auth.users

-- ============================================================================
-- STEP 1: DELETE EMPTY PROFILES (optional - to clean up)
-- ============================================================================

DELETE FROM public.profiles 
WHERE email IS NULL OR email = '' 
OR full_name IS NULL OR full_name = '';

-- ============================================================================
-- STEP 2: INSERT ALL AUTH USERS INTO PROFILES TABLE
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(email, 'User'),
  'customer',
  created_at,
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = auth.users.id
);

-- ============================================================================
-- STEP 3: UPDATE ALL EXISTING PROFILES WITH EMAIL AND NAME
-- ============================================================================

UPDATE public.profiles
SET 
  email = COALESCE(email, (SELECT email FROM auth.users WHERE auth.users.id = public.profiles.id)),
  full_name = COALESCE(full_name, (SELECT email FROM auth.users WHERE auth.users.id = public.profiles.id))
WHERE email IS NULL OR email = '' OR full_name IS NULL OR full_name = '';

-- ============================================================================
-- STEP 4: VERIFY - RUN THIS TO SEE ALL USERS
-- ============================================================================

SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  phone
FROM public.profiles
ORDER BY created_at DESC;
