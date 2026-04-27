# SUPABASE DATABASE MIGRATION - STEP BY STEP GUIDE

## ⚠️ CRITICAL: This migration MUST be run for the fixes to work

---

## STEP 1: Get the Migration SQL

The migration file is located at:
```
supabase/migrations/add_phone_and_payment_fields.sql
```

**What it contains**:
- Adds `is_deleted` and `deleted_at` columns to profiles table
- Creates password reset tokens table
- Creates phone login mappings table
- Adds country field to profiles
- Creates necessary indexes for performance

---

## STEP 2: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (BraidMe)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

---

## STEP 3: Copy the Migration SQL

Open the file `supabase/migrations/add_phone_and_payment_fields.sql` and copy the entire content.

**The SQL includes**:
```sql
-- Add phone fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_country TEXT DEFAULT 'NG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Add payment method field to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

-- Create password reset tokens table
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create phone login mappings table
DROP TABLE IF EXISTS phone_login_mappings CASCADE;
CREATE TABLE phone_login_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  phone_country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone, phone_country)
);

-- Add country field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'NG';

-- Add soft delete flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
```

---

## STEP 4: Paste into SQL Editor

1. In the SQL Editor, paste the entire migration SQL
2. You should see the SQL code in the editor

---

## STEP 5: Run the Migration

1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for the query to complete
3. You should see a success message

**Expected output**:
```
Query executed successfully
```

---

## STEP 6: Verify the Migration

After running, verify the changes were applied:

### Check 1: Verify profiles table has new columns
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_deleted', 'deleted_at', 'country', 'phone');
```

### Check 2: Verify password_reset_tokens table exists
```sql
SELECT * FROM password_reset_tokens LIMIT 1;
```

### Check 3: Verify phone_login_mappings table exists
```sql
SELECT * FROM phone_login_mappings LIMIT 1;
```

---

## TROUBLESHOOTING

### Error: "Column already exists"
- This is OK! The migration uses `IF NOT EXISTS` to prevent errors
- The migration will skip columns that already exist

### Error: "Table already exists"
- This is OK! The migration uses `DROP TABLE IF EXISTS` first
- It will recreate the table with the correct schema

### Error: "Permission denied"
- Make sure you're using the correct Supabase project
- Make sure you have admin access to the project

### Error: "Foreign key constraint failed"
- This shouldn't happen with this migration
- If it does, check that auth.users table exists

---

## AFTER MIGRATION: VERIFY FIXES WORK

Once migration is complete, test these scenarios:

### Test 1: Forgot Password
1. Go to login page
2. Click "Forgot Password"
3. Enter email
4. ✅ Should receive email with reset link

### Test 2: Payment Routing (USA)
1. Create USA customer
2. Create Nigerian braider
3. USA customer books Nigerian braider
4. ✅ Should show Stripe (USD)

### Test 3: Payment Routing (Nigeria)
1. Create Nigerian customer
2. Create Nigerian braider
3. Nigerian customer books Nigerian braider
4. ✅ Should show Paystack (NGN)

### Test 4: User Deletion
1. Go to Admin → Users
2. Delete a user
3. ✅ User should disappear from list

### Test 5: Deleted Users Hidden
1. Go to Admin → Users
2. ✅ Should only see active users
3. Go to Homepage → Braiders
4. ✅ Should only see active braiders

---

## MIGRATION COMPLETE ✅

Once all tests pass, the fixes are fully deployed and working!

