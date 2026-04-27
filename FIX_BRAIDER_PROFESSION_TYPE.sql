-- Fix braiders with incorrect profession_type
-- This script updates braiders that have profession_type = 'barber' to 'braider'

-- First, let's see how many braiders have the wrong profession_type
SELECT COUNT(*) as braiders_with_wrong_type
FROM braider_profiles
WHERE profession_type = 'barber';

-- Update braiders with wrong profession_type
UPDATE braider_profiles
SET profession_type = 'braider'
WHERE profession_type = 'barber'
AND user_id IN (
  SELECT id FROM profiles WHERE role = 'braider'
);

-- Verify the fix
SELECT COUNT(*) as braiders_with_correct_type
FROM braider_profiles
WHERE profession_type = 'braider';

SELECT COUNT(*) as barbers_with_correct_type
FROM braider_profiles
WHERE profession_type = 'barber';

-- Show all braiders and their profession types
SELECT 
  bp.id,
  p.full_name,
  p.role,
  bp.profession_type,
  bp.created_at
FROM braider_profiles bp
JOIN profiles p ON bp.user_id = p.id
ORDER BY bp.created_at DESC
LIMIT 20;
