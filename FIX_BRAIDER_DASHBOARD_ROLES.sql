-- Fix braider roles in profiles table
-- This script updates all users who have a braider_profiles record to have role='braider'

UPDATE profiles
SET role = 'braider', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT user_id FROM braider_profiles
)
AND role != 'braider';

-- Verify the update
SELECT COUNT(*) as braiders_updated FROM profiles WHERE role = 'braider';
