# COPY-PASTE MIGRATION SQL FOR SUPABASE

## ⚠️ IMPORTANT: Copy the SQL below and paste into Supabase SQL Editor

---

## STEP 1: Go to Supabase Dashboard

1. Open https://app.supabase.com
2. Select your BraidMe project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

---

## STEP 2: Copy the SQL Below

Copy everything from the line `-- ============================================================================` to the end.

---

## SQL TO COPY-PASTE:

```sql
-- ============================================================================
-- MIGRATION: Add phone login support and payment gateway routing
-- ============================================================================
-- This migration adds:
-- 1. Phone field to profiles table for phone-based login
-- 2. Phone country field for international phone support
-- 3. Payment method field to bookings for currency-aware routing
-- 4. Forgot password tokens table for password recovery

-- ============================================================================
-- 1. Add phone fields to profiles table
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_country TEXT DEFAULT 'NG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Create unique index on phone for phone-based login
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_phone_country ON profiles(phone_country);

-- ============================================================================
-- 2. Add payment method field to bookings table
-- ============================================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);

-- ============================================================================
-- 3. Create password reset tokens table
-- ============================================================================
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

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own reset tokens" ON password_reset_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- 4. Create email verification table for phone login
-- ============================================================================
DROP TABLE IF EXISTS phone_login_mappings CASCADE;
CREATE TABLE phone_login_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  phone_country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone, phone_country)
);

ALTER TABLE phone_login_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own phone mappings" ON phone_login_mappings FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_phone_login_mappings_user_id ON phone_login_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_login_mappings_phone ON phone_login_mappings(phone, phone_country);

-- ============================================================================
-- 5. Add country field to profiles if not exists
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'NG';
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);

-- ============================================================================
-- 6. Add soft delete flag to profiles
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
```

---

## STEP 3: Paste into SQL Editor

1. In Supabase SQL Editor, paste the SQL above
2. You should see the SQL code in the editor

---

## STEP 4: Run the Migration

1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for the query to complete
3. You should see a success message

**Expected output**:
```
Query executed successfully
```

---

## STEP 5: Verify Success

After running, you should see:
- ✅ No errors
- ✅ "Query executed successfully" message
- ✅ All columns added to profiles table
- ✅ New tables created (password_reset_tokens, phone_login_mappings)

---

## WHAT THIS MIGRATION DOES

### 1. Adds phone fields to profiles
- `phone` - User's phone number
- `phone_country` - Country code (NG, US, etc.)
- `phone_verified` - Whether phone is verified

### 2. Adds payment fields to bookings
- `payment_method` - 'stripe' or 'paystack'
- `currency` - 'USD' or 'NGN'
- `paystack_reference` - Paystack transaction reference

### 3. Creates password_reset_tokens table
- Stores password reset tokens
- Tokens expire after 24 hours
- Used for forgot password flow

### 4. Creates phone_login_mappings table
- Maps phone numbers to users
- Supports international phone numbers
- Used for phone-based login

### 5. Adds country field to profiles
- Stores user's country
- Used for payment routing

### 6. Adds soft delete flags to profiles
- `is_deleted` - Whether user is deleted
- `deleted_at` - When user was deleted
- Allows data recovery if needed

---

## TROUBLESHOOTING

### Error: "Column already exists"
✅ This is OK! The migration uses `IF NOT EXISTS` to prevent errors.
The migration will skip columns that already exist.

### Error: "Table already exists"
✅ This is OK! The migration uses `DROP TABLE IF EXISTS` first.
It will recreate the table with the correct schema.

### Error: "Permission denied"
❌ Make sure you're using the correct Supabase project.
Make sure you have admin access to the project.

### Error: "Foreign key constraint failed"
❌ This shouldn't happen with this migration.
If it does, check that auth.users table exists.

### No error but nothing happened
✅ This is OK! The migration uses `IF NOT EXISTS` for all operations.
If columns already exist, they won't be recreated.

---

## AFTER MIGRATION: NEXT STEPS

1. **Test Forgot Password Email**
   - Go to login page
   - Click "Forgot Password"
   - Enter email
   - ✅ Should receive email with reset link

2. **Test Payment Routing (USA)**
   - Create USA customer
   - Create Nigerian braider
   - USA customer books Nigerian braider
   - ✅ Should show Stripe (USD)

3. **Test Payment Routing (Nigeria)**
   - Create Nigerian customer
   - Create Nigerian braider
   - Nigerian customer books Nigerian braider
   - ✅ Should show Paystack (NGN)

4. **Test User Deletion**
   - Go to Admin → Users
   - Delete a user
   - ✅ User should disappear from list

5. **Test Deleted Users Hidden**
   - Go to Admin → Users
   - ✅ Should only see active users
   - Go to Homepage → Braiders
   - ✅ Should only see active braiders

---

## MIGRATION COMPLETE ✅

Once all tests pass, the fixes are fully deployed and working!

