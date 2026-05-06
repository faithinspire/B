-- ============================================================================
-- FIX BRAIDERS AND BOOKINGS - POPULATE MISSING DATA
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE ALL BRAIDERS HAVE COMPLETE PROFILES
-- ============================================================================

INSERT INTO public.braider_profiles (user_id, full_name, email, bio, verification_status, created_at, updated_at)
SELECT 
  p.id,
  p.full_name,
  p.email,
  'Professional braider' as bio,
  'unverified' as verification_status,
  NOW(),
  NOW()
FROM public.profiles p
WHERE p.role = 'braider'
AND NOT EXISTS (
  SELECT 1 FROM public.braider_profiles bp WHERE bp.user_id = p.id
)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: CREATE SAMPLE SERVICES FOR BRAIDERS
-- ============================================================================

INSERT INTO public.services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT 
  bp.user_id,
  'Box Braids' as name,
  'Professional box braids' as description,
  'box_braids' as category,
  120 as duration_minutes,
  80.00 as price,
  true as is_active,
  NOW(),
  NOW()
FROM public.braider_profiles bp
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s WHERE s.braider_id = bp.user_id AND s.name = 'Box Braids'
);

INSERT INTO public.services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT 
  bp.user_id,
  'Knotless Braids' as name,
  'Knotless braiding service' as description,
  'knotless' as category,
  150 as duration_minutes,
  100.00 as price,
  true as is_active,
  NOW(),
  NOW()
FROM public.braider_profiles bp
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s WHERE s.braider_id = bp.user_id AND s.name = 'Knotless Braids'
);

INSERT INTO public.services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT 
  bp.user_id,
  'Cornrows' as name,
  'Beautiful cornrow styles' as description,
  'cornrows' as category,
  90 as duration_minutes,
  60.00 as price,
  true as is_active,
  NOW(),
  NOW()
FROM public.braider_profiles bp
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s WHERE s.braider_id = bp.user_id AND s.name = 'Cornrows'
);

-- ============================================================================
-- STEP 3: VERIFY RESULTS
-- ============================================================================

SELECT 
  'Braider Profiles' as table_name,
  COUNT(*) as total_records
FROM public.braider_profiles

UNION ALL

SELECT 
  'Services' as table_name,
  COUNT(*) as total_records
FROM public.services;

-- Show braiders with services
SELECT 
  bp.id,
  bp.user_id,
  bp.full_name,
  bp.email,
  COUNT(s.id) as service_count
FROM public.braider_profiles bp
LEFT JOIN public.services s ON s.braider_id = bp.user_id
GROUP BY bp.id, bp.user_id, bp.full_name, bp.email
ORDER BY bp.created_at DESC;

-- Show all services
SELECT 
  s.id,
  s.braider_id,
  s.name,
  s.category,
  s.price,
  s.duration_minutes
FROM public.services s
ORDER BY s.created_at DESC;
