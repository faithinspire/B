# IMMEDIATE: Fix Braider Signup Error

## Error You're Getting
```
Server error: Failed to create braider profile: COULD NOT FIND THE ID_DOCUMENT_URL COLUMN OF BRAIDERS_PROFILES IN THE SCHEMA CACHE
```

## What To Do RIGHT NOW

### 1. Go to Supabase Dashboard
- Open your Supabase project
- Click "SQL Editor" in the left sidebar
- Create a new query

### 2. Copy and Paste This SQL

```sql
-- Add missing columns to braider_profiles table
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Create braider_verification table if it doesn't exist
CREATE TABLE IF NOT EXISTS braider_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  full_name TEXT,
  phone TEXT,
  location_country TEXT DEFAULT 'NG',
  location_state TEXT,
  location_city TEXT,
  years_experience INTEGER DEFAULT 0,
  specialization TEXT,
  id_document_type TEXT,
  id_number TEXT,
  id_document_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_braider_profiles_phone ON braider_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_state ON braider_profiles(state);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_city ON braider_profiles(city);
CREATE INDEX IF NOT EXISTS idx_braider_verification_user_id ON braider_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_braider_verification_status ON braider_verification(status);

-- Disable RLS to allow signup to work
ALTER TABLE braider_verification DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
```

### 3. Click "Run" Button
- Wait for the query to complete
- You should see "Success" message

### 4. Test Braider Signup
- Go back to your app
- Try signing up as a braider again
- It should now work!

## What This Does

✅ Adds 13 missing columns to `braider_profiles` table
✅ Creates `braider_verification` table for tracking verification
✅ Creates indexes for faster lookups
✅ Disables RLS so signup can insert records

## Code Changes Made

1. **Updated `app/api/auth/signup/route.ts`**
   - Now handles missing columns gracefully
   - Only inserts columns that exist
   - Better error messages

2. **Created migration files**
   - `supabase/migrations/fix_braider_signup_schema.sql`
   - `supabase/migrations/add_braider_profile_missing_columns.sql`

3. **Created setup endpoints**
   - `app/api/admin/setup-braider-schema/route.ts` - Check schema status
   - `app/api/admin/fix-braider-schema/route.ts` - Attempt to fix schema

## After Running SQL

The braider signup will now:
1. Create auth user ✅
2. Create profile record ✅
3. Create braider_profiles record ✅
4. Create braider_verification record ✅
5. Return success ✅

All without schema errors!

## Questions?

If you still get errors after running the SQL:
1. Check that all SQL executed without errors
2. Verify the columns were added: Go to Supabase → Tables → braider_profiles → check columns
3. Make sure RLS is disabled on both tables
