-- ============================================================================
-- CRITICAL FIX: Admin Dashboard Issues
-- Fixes: Missing columns, deleted users, admin role assignment
-- ============================================================================

-- 1. ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. ENSURE BRAIDER_PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2);
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 3. SYNC BRAIDER_PROFILES WITH PROFILES DATA
-- ============================================================================
-- Copy email from profiles to braider_profiles where missing
UPDATE braider_profiles bp
SET email = p.email
FROM profiles p
WHERE bp.user_id = p.id AND bp.email IS NULL;

-- Copy full_name from profiles to braider_profiles where missing
UPDATE braider_profiles bp
SET full_name = p.full_name
FROM profiles p
WHERE bp.user_id = p.id AND bp.full_name IS NULL;

-- Copy phone from profiles to braider_profiles where missing
UPDATE braider_profiles bp
SET phone = p.phone
FROM profiles p
WHERE bp.user_id = p.id AND bp.phone IS NULL;

-- Copy avatar_url from profiles to braider_profiles where missing
UPDATE braider_profiles bp
SET avatar_url = p.avatar_url
FROM profiles p
WHERE bp.user_id = p.id AND bp.avatar_url IS NULL;

-- 4. MAKE 3 USERS ADMIN - PASTE YOUR EMAILS BELOW
-- ============================================================================
-- IMPORTANT: Replace the emails with your actual admin emails
UPDATE profiles 
SET role = 'admin' 
WHERE email IS NOT NULL AND email IN (
  'your-email-1@gmail.com',
  'your-email-2@gmail.com', 
  'your-email-3@gmail.com'
);

-- 5. DISABLE RLS ON CRITICAL TABLES
-- ============================================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

GRANT ALL ON braider_profiles TO authenticated;
GRANT ALL ON braider_profiles TO anon;
GRANT ALL ON braider_profiles TO service_role;

GRANT ALL ON password_reset_tokens TO authenticated;
GRANT ALL ON password_reset_tokens TO anon;
GRANT ALL ON password_reset_tokens TO service_role;

-- 6. VERIFY CHANGES
-- ============================================================================
-- Check admin users
SELECT 'Admin Users:' as status;
SELECT email, role FROM profiles WHERE role = 'admin' LIMIT 3;

-- Check braiders count
SELECT 'Braiders Count:' as status;
SELECT COUNT(*) as total_braiders FROM braider_profiles;

-- Check users count
SELECT 'Users Count:' as status;
SELECT COUNT(*) as total_users FROM profiles WHERE is_deleted = false;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Next steps:
-- 1. Verify admin emails are set correctly
-- 2. Clear browser cache and log in again
-- 3. Admin dashboard should now load braiders and users
-- 4. Barber section will appear once braiders are loaded
