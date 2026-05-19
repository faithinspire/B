-- Delete user with email: bidemiobisakin@hotmail.com
-- This script will remove the user from auth.users and all related data

BEGIN;

-- Get the user ID first
WITH user_to_delete AS (
  SELECT id FROM auth.users WHERE email = 'bidemiobisakin@hotmail.com'
)
DELETE FROM auth.users 
WHERE email = 'bidemiobisakin@hotmail.com';

-- Also delete from profiles table if it exists
WITH user_to_delete AS (
  SELECT id FROM auth.users WHERE email = 'bidemiobisakin@hotmail.com'
)
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'bidemiobisakin@hotmail.com');

-- Delete from braider_profiles if exists
DELETE FROM public.braider_profiles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'bidemiobisakin@hotmail.com');

COMMIT;

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM auth.users WHERE email = 'bidemiobisakin@hotmail.com';
