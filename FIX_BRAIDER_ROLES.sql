-- Fix braider roles in profiles table
-- This script ensures all braiders have role='braider' in the profiles table

-- 1. Check current state
SELECT 'Current braider profiles with wrong role:' as status;
SELECT id, email, role FROM profiles 
WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles)
AND role != 'braider'
LIMIT 10;

-- 2. Update all braiders to have correct role
UPDATE profiles 
SET role = 'braider', updated_at = NOW()
WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles)
AND role != 'braider';

-- 3. Verify the fix
SELECT 'Braiders after fix:' as status;
SELECT id, email, role FROM profiles 
WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles)
LIMIT 10;

-- 4. Check for any customers who shouldn't be customers
SELECT 'Verify no braiders are marked as customers:' as status;
SELECT COUNT(*) as braiders_with_customer_role FROM profiles 
WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles)
AND role = 'customer';
