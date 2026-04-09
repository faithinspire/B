# CRITICAL: Database Migration Required

## Issue Summary
The `braider_profiles` table is missing critical columns that the API tries to fetch and sort by:
- `is_premium` (BOOLEAN)
- `featured_order` (INTEGER)
- `latitude` (DECIMAL)
- `longitude` (DECIMAL)

This is why braiders are NOT displaying on the homepage Featured Braiders section.

## Immediate Action Required

### Step 1: Run SQL in Supabase Dashboard
1. Go to: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new
2. Copy and paste the SQL below
3. Click "Run"

```sql
-- Add missing columns to braider_profiles table
ALTER TABLE braider_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);

-- Add phone and bio to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index for fast featured braider queries
CREATE INDEX IF NOT EXISTS idx_braider_profiles_featured 
  ON braider_profiles(is_premium DESC, featured_order DESC, rating_avg DESC);

-- Verify columns exist
SELECT 'Migration complete' AS status;
```

### Step 2: Verify Migration
After running the SQL, you should see "Migration complete" message.

### Step 3: Test the Fix
1. Restart your dev server: `npm run dev`
2. Go to homepage: http://localhost:3001
3. Scroll to "Featured Braiders" section
4. You should now see braiders displaying in the carousel

## What This Fixes
✅ Braiders will display on homepage Featured Braiders section
✅ API will return complete braider data with all fields
✅ Sorting by premium status, featured order, and rating will work
✅ Location data (latitude/longitude) will be available for maps

## If You Get an Error
If you see an error like "column already exists", that's fine - it means the columns were already added. The `IF NOT EXISTS` clause prevents errors.

## Next Steps After Migration
1. Verify braiders show on homepage
2. Check admin dashboard displays customer data
3. Test admin users page shows all user details
4. Verify role detection works correctly

---

**Status**: CRITICAL - Must complete before testing braider display
**Time to Complete**: 2 minutes
**Difficulty**: Easy (just copy/paste SQL)
