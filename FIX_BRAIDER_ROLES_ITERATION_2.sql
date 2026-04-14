-- Fix braiders showing as customer role
-- This SQL updates any braiders who have braider_profiles records but are marked as 'customer' in profiles table

UPDATE profiles
SET role = 'braider', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT bp.user_id 
  FROM braider_profiles bp
  WHERE bp.user_id IS NOT NULL
)
AND role != 'braider';

-- Verify the fix
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  bp.user_id as has_braider_profile
FROM profiles p
LEFT JOIN braider_profiles bp ON p.id = bp.user_id
WHERE bp.user_id IS NOT NULL
ORDER BY p.created_at DESC;
