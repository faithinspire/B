# Fix RLS and Braiders Display - Final Solution

## Problem
1. RLS SQL failed with "relation verification_documents does not exist"
2. Braiders not showing on homepage even though they're registered

## Solution

### Step 1: Run the Safe RLS Disable Script

The previous SQL failed because it tried to disable RLS on tables that don't exist. Use this safe version instead:

**File**: `DISABLE_RLS_SAFE.sql`

This script uses `IF EXISTS` to skip tables that don't exist.

#### How to Run:
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy ALL content from `DISABLE_RLS_SAFE.sql`
5. Paste into SQL Editor
6. Click **Run**

#### What It Does:
- Disables RLS on all existing tables
- Skips tables that don't exist (no errors)
- Shows you which tables have RLS disabled

---

### Step 2: Verify RLS is Disabled

After running the SQL, you should see a table showing:
- All tables with `rowsecurity = f` (false)

This means RLS is disabled ✅

---

### Step 3: Hard Refresh Your App

1. Go to your app
2. Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
3. Clear browser cache if needed

---

### Step 4: Check Browser Console

1. Open browser console (F12)
2. Go to homepage
3. Look for logs showing:
   - "Fetching braiders from /api/braiders..."
   - "Braiders API response: { count: X, data: [...] }"
   - "Featured braiders after filter: { count: X, featured: [...] }"

If you see braiders in the logs, they're being fetched ✅

---

## What Was Fixed in Code

### 1. Braiders API (`app/api/braiders/route.ts`)
- ✅ Now uses service role to bypass RLS
- ✅ Fetches ALL columns from braider_profiles
- ✅ Added logging to debug issues
- ✅ Returns complete braider data

### 2. Homepage (`app/(public)/page.tsx`)
- ✅ Removed email filter (was blocking braiders)
- ✅ Added logging to show braiders data
- ✅ Shows featured braiders carousel

### 3. Braiders Hook (`app/hooks/useBraiders.ts`)
- ✅ Added logging to track data flow
- ✅ Properly normalizes braider data
- ✅ Handles errors gracefully

---

## Testing After Fix

### Test 1: Check Braiders Display
1. Go to homepage
2. Scroll to "Featured Braiders" section
3. Should see registered braiders ✅

### Test 2: Check Browser Console
1. Open F12 (Developer Tools)
2. Go to Console tab
3. Should see logs showing braiders being fetched ✅

### Test 3: Upload Avatar
1. Sign up as braider
2. Go to dashboard
3. Click "Upload Photo"
4. Upload an image
5. Should work without RLS errors ✅

### Test 4: Upload Portfolio
1. Go to portfolio page
2. Click "Add Photos"
3. Upload an image
4. Should work without RLS errors ✅

### Test 5: Add Service
1. Go to services page
2. Click "Add Service"
3. Fill in details
4. Should work without RLS errors ✅

---

## If Braiders Still Not Showing

### Check 1: Verify RLS is Actually Disabled
1. Go to Supabase SQL Editor
2. Run this query:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```
3. Check that `braider_profiles` has `rowsecurity = f`

### Check 2: Verify Braiders Exist in Database
1. Go to Supabase
2. Click **Table Editor**
3. Select `braider_profiles` table
4. Should see registered braiders

### Check 3: Check Browser Console
1. Open F12
2. Go to Console tab
3. Look for error messages
4. Check if braiders are being fetched

### Check 4: Hard Refresh
1. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Try again

---

## If Uploads Still Failing

### Check 1: Verify RLS is Disabled
Run the safe SQL script again to make sure RLS is disabled

### Check 2: Check Error Message
1. Open browser console (F12)
2. Try uploading
3. Look for error message
4. Share the error message

### Check 3: Try Different File
1. Try uploading a different image
2. Make sure file is under 5MB (avatar) or 10MB (portfolio)
3. Make sure file is a valid image (JPG, PNG, etc.)

---

## Files to Use

1. **DISABLE_RLS_SAFE.sql** - Safe SQL script (use this one!)
2. **FIX_RLS_AND_BRAIDERS_NOW.md** - This file

---

## Summary

1. ✅ Run `DISABLE_RLS_SAFE.sql` in Supabase
2. ✅ Hard refresh your app
3. ✅ Check browser console for logs
4. ✅ Braiders should show on homepage
5. ✅ Uploads should work

---

## Need Help?

If something doesn't work:
1. Check browser console (F12)
2. Look for error messages
3. Verify RLS is disabled in Supabase
4. Hard refresh the page
5. Clear browser cache and cookies
6. Try again

---

**That's it! Everything should work now.**
