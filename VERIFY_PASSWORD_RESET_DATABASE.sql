-- ============================================================================
-- PASSWORD RESET SYSTEM - DATABASE VERIFICATION & SETUP
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to verify and fix the password reset system
-- ============================================================================

-- SECTION 1: VERIFY TABLE EXISTS
-- ============================================================================
SELECT 
  'TABLE VERIFICATION' as check_type,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'password_reset_tokens'
  ) as table_exists;

-- SECTION 2: CHECK TABLE STRUCTURE
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'password_reset_tokens'
ORDER BY ordinal_position;

-- SECTION 3: CHECK RLS STATUS
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'password_reset_tokens';

-- SECTION 4: CHECK INDEXES
-- ============================================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'password_reset_tokens'
ORDER BY indexname;

-- SECTION 5: CHECK RECENT TOKENS
-- ============================================================================
SELECT 
  id,
  email,
  token_hash,
  expires_at,
  created_at,
  CASE 
    WHEN expires_at > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as status
FROM password_reset_tokens
ORDER BY created_at DESC
LIMIT 20;

-- SECTION 6: CHECK EXPIRED TOKENS
-- ============================================================================
SELECT 
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_tokens,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_tokens
FROM password_reset_tokens;

-- SECTION 7: CHECK TOKENS BY EMAIL
-- ============================================================================
-- Replace 'your@email.com' with the email you want to check
SELECT 
  id,
  email,
  token_hash,
  expires_at,
  created_at,
  CASE 
    WHEN expires_at > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as status
FROM password_reset_tokens
WHERE email = 'your@email.com'
ORDER BY created_at DESC;

-- SECTION 8: CLEANUP - DELETE EXPIRED TOKENS (OPTIONAL)
-- ============================================================================
-- Uncomment to delete tokens older than 24 hours
-- DELETE FROM password_reset_tokens
-- WHERE expires_at < NOW() - INTERVAL '24 hours';

-- SECTION 9: VERIFY PERMISSIONS
-- ============================================================================
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'password_reset_tokens'
ORDER BY grantee, privilege_type;

-- SECTION 10: CREATE TABLE IF NOT EXISTS (SAFETY CHECK)
-- ============================================================================
-- This will only create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SECTION 11: ENSURE RLS IS DISABLED
-- ============================================================================
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- SECTION 12: CREATE INDEXES IF NOT EXISTS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email 
ON password_reset_tokens(email);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash 
ON password_reset_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at 
ON password_reset_tokens(expires_at);

-- SECTION 13: GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON password_reset_tokens TO authenticated;
GRANT ALL ON password_reset_tokens TO service_role;
GRANT ALL ON password_reset_tokens TO anon;

-- SECTION 14: FINAL VERIFICATION
-- ============================================================================
SELECT 
  'FINAL VERIFICATION' as check_type,
  (SELECT COUNT(*) FROM password_reset_tokens) as total_tokens,
  (SELECT COUNT(*) FROM password_reset_tokens WHERE expires_at > NOW()) as valid_tokens,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'password_reset_tokens'
  ) as table_exists,
  (
    SELECT rowsecurity FROM pg_tables 
    WHERE tablename = 'password_reset_tokens'
  ) as rls_enabled;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If all checks pass:
-- ✅ Table exists
-- ✅ RLS is disabled
-- ✅ Indexes are created
-- ✅ Permissions are granted
-- ✅ System is ready for password reset emails
--
-- If any check fails:
-- 1. Run SECTION 10 to create the table
-- 2. Run SECTION 11 to disable RLS
-- 3. Run SECTION 12 to create indexes
-- 4. Run SECTION 13 to grant permissions
-- 5. Run SECTION 14 to verify
-- ============================================================================
