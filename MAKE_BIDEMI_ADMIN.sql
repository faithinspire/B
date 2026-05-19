-- FORCE: Make bidemiobisakin@hotmail.com an ADMIN and REMOVE from BRAIDER
-- This script completely removes braider profile and sets admin role

BEGIN;

-- 1. Get the user ID
WITH user_data AS (
  SELECT id FROM auth.users 
  WHERE email = 'bidemiobisakin@hotmail.com'
)

-- 2. DELETE the braider_profiles record completely (remove braider status)
DELETE FROM braider_profiles
WHERE user_id IN (SELECT id FROM user_data);

-- 3. Update profiles table to set role as 'admin' and ensure it's saved
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE id IN (SELECT id FROM user_data);

-- 4. Verify the changes - should show admin role and NO braider profile
SELECT 
  u.id,
  u.email,
  p.role,
  bp.id as braider_profile_exists
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN braider_profiles bp ON u.id = bp.user_id
WHERE u.email = 'bidemiobisakin@hotmail.com';

COMMIT;
