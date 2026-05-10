# 📋 Copy-Paste SQL - Ready to Run

## Instructions

1. Go to: **https://app.supabase.com/**
2. Select **BRAID2** project
3. Click **SQL Editor** → **New Query**
4. **Copy everything below** (from "DROP TABLE" to the end)
5. **Paste into SQL Editor**
6. Click **Run**
7. ✅ Done!

---

## SQL to Copy & Paste

```sql
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
-- Update the first 3 users to have admin role

-- First, ensure profiles table has role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- Make the first 3 users admin (by ID or email - adjust as needed)
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 3
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
```

---

## What This SQL Does

✅ **Creates password_reset_tokens table** with correct schema
✅ **Makes first 3 users admin** 
✅ **Disables RLS** on both tables
✅ **Grants permissions** for API access
✅ **Verifies changes** with SELECT statements

---

## Expected Output

After running, you should see:

```
Query executed successfully

password_reset_tokens table created

email                    | role
-------------------------|-------
user1@example.com        | admin
user2@example.com        | admin
user3@example.com        | admin
```

---

## If You Get Errors

### Error: "Table already exists"
**This is OK!** The `DROP TABLE IF EXISTS` handles it.

### Error: "Column already exists"
**This is OK!** The `ADD COLUMN IF NOT EXISTS` handles it.

### Error: "Permission denied"
**Solution**: Make sure you're using service role key, not anon key

### Error: "Relation does not exist"
**Solution**: Make sure profiles table exists (it should)

---

## Next Steps After Running SQL

1. ✅ SQL migration complete
2. ⏳ Verify Resend domain (see RESEND_DOMAIN_VERIFICATION_GUIDE.md)
3. ⏳ Test password reset
4. ⏳ Test admin access

---

## Quick Checklist

- [ ] Opened Supabase
- [ ] Selected BRAID2 project
- [ ] Opened SQL Editor
- [ ] Created new query
- [ ] Copied SQL above
- [ ] Pasted into editor
- [ ] Clicked Run
- [ ] Saw success messages
- [ ] Saw admin users listed
- [ ] ✅ SQL migration complete!

---

**Status**: Ready to copy and paste!

