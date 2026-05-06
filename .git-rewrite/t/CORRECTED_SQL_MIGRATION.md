# CORRECTED SQL MIGRATION - Run This Now

## Error Fixed
The previous SQL had a reference to a non-existent table. This corrected version only adds columns to existing tables.

## Where to Run
Go to: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

## Copy This Entire SQL Block

```sql
-- Add missing columns to braider_profiles table
ALTER TABLE braider_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);

-- Add phone column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for fast featured braider queries
CREATE INDEX IF NOT EXISTS idx_braider_profiles_featured 
  ON braider_profiles(is_premium DESC, featured_order DESC, rating_avg DESC);

-- Verify migration completed
SELECT 'Migration completed successfully!' AS status;
```

## Steps to Execute

1. **Open Supabase SQL Editor**
   - Go to: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

2. **Paste the SQL**
   - Copy the entire SQL block above
   - Paste into the SQL editor

3. **Run the Query**
   - Click the "Run" button (or press Ctrl+Enter)
   - Wait for the query to complete

4. **Expected Result**
   - You should see: "Migration completed successfully!"
   - No errors should appear

## What This Does

### Adds to `braider_profiles` table:
- `is_premium` (BOOLEAN) - Marks premium braiders
- `featured_order` (INTEGER) - Controls featured braider order
- `latitude` (DECIMAL) - For location-based features
- `longitude` (DECIMAL) - For location-based features

### Adds to `profiles` table:
- `phone` (TEXT) - User phone number

### Creates Index:
- Fast queries for featured braiders sorted by premium status, featured order, and rating

## After Running SQL

1. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test Homepage**
   - Open http://localhost:3001
   - Scroll to "Featured Braiders" section
   - Should see braider cards in carousel

3. **Test Admin Dashboard**
   - Go to http://localhost:3001/admin/dashboard
   - Should show admin dashboard (not customer page)

4. **Test Admin Users**
   - Go to http://localhost:3001/admin/users
   - Should show table with all users and phone numbers

## If You Get an Error

### "Column already exists"
- This is fine! It means the columns were already added
- The `IF NOT EXISTS` clause prevents errors
- Just click "Run" again or ignore the error

### "Permission denied"
- Make sure you're using the service role key
- Check that you're logged in to Supabase

### Other errors
- Copy the error message
- Check the troubleshooting guide

## Verification

After running SQL, verify columns were added:

1. Go to Supabase Dashboard: https://app.supabase.com/project/gymgxcspjysrkluxyavd/editor
2. Click on `braider_profiles` table
3. Scroll right to see all columns
4. You should see: `is_premium`, `featured_order`, `latitude`, `longitude`
5. Click on `profiles` table
6. You should see: `phone`

## Success Indicators

✅ SQL ran without errors
✅ "Migration completed successfully!" message appears
✅ New columns visible in Supabase dashboard
✅ Dev server restarted
✅ Braiders display on homepage
✅ Admin dashboard shows correct page
✅ Admin users page shows phone numbers

---

**Time to Complete**: 2 minutes
**Difficulty**: Easy (just copy & paste)
**Result**: All three issues fixed

---

*After running this SQL, restart your dev server and test the fixes!*
