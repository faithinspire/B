# Verify Database State - Check if Columns Exist

## Quick Check in Supabase

### Step 1: Check braider_profiles Table
1. Go to: https://app.supabase.com/project/gymgxcspjysrkluxyavd/editor
2. Click on `braider_profiles` table
3. Look at the columns - scroll right to see all
4. **Check if these columns exist**:
   - ✅ `is_premium` (BOOLEAN)
   - ✅ `featured_order` (INTEGER)
   - ✅ `latitude` (DECIMAL)
   - ✅ `longitude` (DECIMAL)

### Step 2: Check profiles Table
1. Click on `profiles` table
2. Look at the columns
3. **Check if these columns exist**:
   - ✅ `phone` (TEXT)
   - ✅ `bio` (TEXT)

### Step 3: Check if Braiders Exist
1. Click on `braider_profiles` table
2. Click "Data" tab
3. Should see rows with braider data
4. **Check if you see**:
   - Braider names
   - Email addresses
   - Rating data
   - Verification status

---

## Run SQL to Verify

If columns are missing, run this SQL in Supabase:

**Go to**: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

**Paste this SQL**:
```sql
-- Add missing columns to braider_profiles
ALTER TABLE braider_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);

-- Add missing columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_braider_profiles_featured 
  ON braider_profiles(is_premium DESC, featured_order DESC, rating_avg DESC);

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('braider_profiles', 'profiles')
  AND column_name IN ('is_premium', 'featured_order', 'latitude', 'longitude', 'phone', 'bio')
ORDER BY table_name, column_name;
```

**Click "Run"** and wait for results.

---

## Expected Results

### If Columns Already Exist
You should see output like:
```
column_name      | data_type
-----------------+-----------
bio              | text
featured_order   | integer
is_premium       | boolean
latitude         | numeric
longitude        | numeric
phone            | text
```

### If Columns Don't Exist
You'll see an error like "column already exists" - that's fine, it means they were already added.

---

## Check Braider Data

### Run this SQL to see braider data:
```sql
SELECT 
  id,
  user_id,
  full_name,
  email,
  rating_avg,
  verification_status,
  is_premium,
  featured_order,
  latitude,
  longitude,
  created_at
FROM braider_profiles
LIMIT 10;
```

**Expected**: Should see 10 braiders with all fields populated.

---

## Check if RLS is Blocking Data

### Run this SQL to check RLS policies:
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('braider_profiles', 'profiles')
ORDER BY tablename, policyname;
```

**Expected**: Should see RLS policies for both tables.

---

## Troubleshooting

### If Columns Don't Exist
1. Run the SQL migration above
2. Wait for "Done!" message
3. Restart dev server
4. Refresh browser

### If Braiders Don't Show in Data
1. Check if braider_profiles table has any rows
2. Run: `SELECT COUNT(*) FROM braider_profiles;`
3. If count is 0, no braiders exist in database

### If RLS is Blocking Data
1. Check RLS policies
2. Verify service role key is being used in API
3. Check if policies allow SELECT for service role

---

## Next Steps

1. **Verify columns exist** in Supabase dashboard
2. **Check braider data** exists in database
3. **Restart dev server** if columns were added
4. **Test homepage** - should see braiders
5. **Check browser console** for any errors

---

**Time to Complete**: 5 minutes
**Difficulty**: Easy (just check Supabase dashboard)
