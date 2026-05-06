-- ============================================================================
-- FIX ADMIN ROLE — RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- STEP 1: Check current admin users
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- STEP 2: If no admin users found, find the admin user by email
-- Replace 'admin@example.com' with your actual admin email
SELECT id, email, role FROM profiles WHERE email = 'admin@example.com';

-- STEP 3: Update the admin user's role to 'admin'
-- Replace 'admin@example.com' with your actual admin email
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@example.com' AND role != 'admin';

-- STEP 4: Verify the update
SELECT id, email, role FROM profiles WHERE email = 'admin@example.com';

-- STEP 5: Check all users and their roles
SELECT id, email, role FROM profiles ORDER BY role, email;

-- ============================================================================
-- ALTERNATIVE: If you know the admin user ID, use this instead:
-- ============================================================================

-- Replace 'USER_ID_HERE' with the actual admin user ID
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = 'USER_ID_HERE' AND role != 'admin';

-- Verify
SELECT id, email, role FROM profiles WHERE id = 'USER_ID_HERE';

-- ============================================================================
-- BULK FIX: If multiple users have wrong roles, fix them all
-- ============================================================================

-- This will sync all profiles with their auth metadata roles
-- (Only works if auth metadata was set correctly during signup)

-- First, check auth users and their metadata
-- Go to Supabase Dashboard → Authentication → Users
-- Look at the "User Metadata" column for each user

-- Then manually update profiles for any mismatches:
-- UPDATE profiles SET role = 'braider' WHERE email = 'braider@example.com';
-- UPDATE profiles SET role = 'customer' WHERE email = 'customer@example.com';
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if admin can access admin dashboard
-- 1. Log in as admin user
-- 2. Go to /admin
-- 3. Should see admin dashboard with stats cards

-- If still seeing customer page:
-- 1. Clear browser cache (F12 → Application → Clear Storage)
-- 2. Log out and log in again
-- 3. Try /admin again

-- ============================================================================
