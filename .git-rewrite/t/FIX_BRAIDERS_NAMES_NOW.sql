-- ============================================================================
-- FIX BRAIDERS TABLE - POPULATE WITH REAL NAMES AND EMAILS
-- ============================================================================
-- This directly updates the braiders table with names and emails from profiles

-- Step 1: Update braiders table with names from profiles
UPDATE public.braiders bp
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
  )
WHERE full_name IS NULL OR full_name = '' OR email IS NULL OR email = '';

-- Step 2: Update braider_profiles table with names from profiles
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
  )
WHERE full_name IS NULL OR full_name = '' OR email IS NULL OR email = '';

-- Step 3: Verify - Show all braiders with their details
SELECT 
  bp.id,
  bp.user_id,
  bp.full_name,
  bp.email,
  bp.bio,
  bp.verification_status,
  bp.rating_avg,
  p.full_name as profile_name,
  p.email as profile_email
FROM public.braider_profiles bp
LEFT JOIN public.profiles p ON bp.user_id = p.id
ORDER BY bp.created_at DESC;

-- Step 4: Show profiles table
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
