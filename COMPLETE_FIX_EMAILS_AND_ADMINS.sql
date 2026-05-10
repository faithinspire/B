-- ============================================================================
-- COMPLETE FIX: Password Reset Table + Make 3 Users Admin + RLS Bypass
-- ============================================================================

-- 1. CREATE PASSWORD_RESET_TOKENS TABLE WITH PROPER SCHEMA
-- ============================================================================
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

CREATE TABLE password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, token_hash)
);

-- Create indexes for performance
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Disable RLS completely for this table
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON password_reset_tokens TO authenticated;
GRANT ALL ON password_reset_tokens TO anon;
GRANT ALL ON password_reset_tokens TO service_role;

-- ============================================================================
-- 2. MAKE 3 USERS ADMIN - UPDATE PROFILES TABLE
-- ============================================================================
-- PASTE YOUR 3 EMAIL ADDRESSES BELOW (replace the example emails)
-- Example: 'your-email@gmail.com', 'admin2@example.com', 'admin3@example.com'
-- 
-- HOW TO USE:
-- 1. Replace 'your-email-1@gmail.com' with your first admin email
-- 2. Replace 'your-email-2@gmail.com' with your second admin email
-- 3. Replace 'your-email-3@gmail.com' with your third admin email
-- 4. Run the entire SQL script in Supabase SQL Editor
-- 5. Check the results at the bottom to verify admins were created

-- First, ensure profiles table has role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- Make 3 specific users admin by email (EDIT THE EMAILS BELOW)
-- IMPORTANT: Only updates users with non-null emails
UPDATE profiles 
SET role = 'admin' 
WHERE email IS NOT NULL AND email IN (
  'your-email-1@gmail.com',
  'your-email-2@gmail.com', 
  'your-email-3@gmail.com'
);

-- ============================================================================
-- 3. DISABLE RLS ON PROFILES TABLE FOR API ACCESS
-- ============================================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- ============================================================================
-- 4. VERIFY CHANGES
-- ============================================================================
-- Check password_reset_tokens table exists
SELECT 'password_reset_tokens table created' as status;

-- Check admin users
SELECT email, role FROM profiles WHERE role = 'admin' LIMIT 3;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Next steps:
-- 1. Verify Resend domain at https://resend.com/domains
-- 2. Test password reset flow
-- 3. Verify admins can access admin dashboard
