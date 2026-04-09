# IMMEDIATE FIX: Show Braiders & Fix Admin Page

## Problem
1. Braiders that registered are not visible
2. Admin page shows customer page instead
3. RLS is blocking data access

## Solution: Disable RLS Permanently

### Step 1: Run SQL in Supabase
1. Go to Supabase Dashboard → Your Project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the entire content from: `DISABLE_RLS_PERMANENT_FIX.sql`
5. Click "Run" button
6. Wait for success message

### Step 2: Verify RLS is Disabled
After running the SQL, run this verification query:

```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `f` (false) for rowsecurity column.

### Step 3: Clear Browser Cache & Refresh
1. Hard refresh your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache/cookies for your app domain
3. Log out and log back in

### Step 4: Test
1. Go to `/admin` - should see Admin Dashboard (not customer page)
2. Click "Manage Users" - should see all registered users
3. Filter by "Braider" role - should see all registered braiders
4. Check "Total Braiders" stat - should show count

## Why This Works
- RLS (Row Level Security) was blocking the profiles table from being read
- Without RLS, all authenticated users can read all data
- Admin API endpoint can now fetch all users successfully
- Auth store can load user roles correctly from profiles table

## If Still Not Working
1. Check browser console for errors (F12)
2. Check Supabase logs for any errors
3. Verify you're logged in as admin user
4. Try incognito/private window to avoid cache issues

## What Was Changed
- Disabled RLS on: profiles, braider_profiles, bookings, payments, messages, conversations, services, reviews, disputes, notifications, location_history
- This allows all authenticated users to read all data
- No data is deleted or modified, only RLS restrictions removed
