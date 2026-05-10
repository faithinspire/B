# ACTION CARD: Admin Dashboard Critical Fix

## Status: ✅ READY TO EXECUTE

---

## What's Wrong

1. ❌ Admin emails not being set to admin role
2. ❌ Braiders page showing "Failed to fetch braiders"
3. ❌ Users page showing "Column is deleted/does not exist"
4. ❌ Barber section not showing on dashboard

## Root Cause

Database schema is incomplete - missing required columns in `profiles` and `braider_profiles` tables.

---

## What to Do NOW

### Step 1: Run SQL Migration (2 minutes)

1. Go to **Supabase Dashboard**
2. Click **SQL Editor**
3. Open file: `CRITICAL_ADMIN_DASHBOARD_FIX.sql`
4. **IMPORTANT**: Replace these 3 emails with YOUR admin emails:
   ```sql
   'your-email-1@gmail.com',    ← YOUR FIRST EMAIL
   'your-email-2@gmail.com',    ← YOUR SECOND EMAIL
   'your-email-3@gmail.com'     ← YOUR THIRD EMAIL
   ```
5. Click **Run**
6. Wait for completion
7. ✅ Verify you see your 3 emails in results with `role = 'admin'`

### Step 2: Clear Browser Cache (1 minute)

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Local Storage**
4. Delete:
   - `braidmee_auth_session`
   - `braidmee_user`
5. Close DevTools

### Step 3: Test (1 minute)

1. Go to http://localhost:3001/login
2. Log in with one of your admin emails
3. ✅ Admin dashboard should load
4. ✅ Braiders page should show list
5. ✅ Users page should show list
6. ✅ Barber section should appear

---

## What the SQL Does

✅ Adds missing columns to `profiles` table:
- `is_deleted` - Track deleted users
- `role` - User role
- `phone` - Phone number
- `avatar_url` - Avatar image

✅ Adds missing columns to `braider_profiles` table:
- `full_name`, `email`, `phone`, `avatar_url`
- `bio`, `specialization`, `verification_status`
- `state`, `city`, `address`
- `experience_years`, `rating_avg`, `rating_count`

✅ Syncs data between tables

✅ Sets your 3 admin emails with admin role

✅ Disables RLS for API access

---

## Expected Results After Fix

- ✅ Admin dashboard loads without errors
- ✅ Braiders page shows all braiders
- ✅ Users page shows all users
- ✅ Barber section visible on dashboard
- ✅ Can search and filter braiders
- ✅ Can search and filter users
- ✅ Admin emails have admin role

---

## Troubleshooting

**Still seeing errors?**
1. Check browser console (F12) for detailed error message
2. Verify SQL migration completed successfully
3. See `ADMIN_DASHBOARD_CRITICAL_ISSUES_FIX.md` for detailed troubleshooting

**Emails not set as admin?**
1. Verify you replaced the placeholder emails in SQL
2. Run this query to check:
   ```sql
   SELECT email, role FROM profiles WHERE role = 'admin';
   ```

**Braiders page still failing?**
1. Check that `braider_profiles` table has data
2. Verify `is_deleted` column exists in `profiles` table

---

## Files

- `CRITICAL_ADMIN_DASHBOARD_FIX.sql` - SQL migration (RUN THIS FIRST!)
- `ADMIN_DASHBOARD_CRITICAL_ISSUES_FIX.md` - Detailed guide
- Code already deployed to production ✅

---

## Timeline

- SQL Migration: 2 minutes
- Clear Cache: 1 minute
- Test: 1 minute
- **Total: ~4 minutes**

---

## Summary

The admin dashboard had database schema issues. The SQL migration adds all missing columns, syncs data, sets admin roles, and disables RLS. After running the SQL and clearing cache, everything will work!

**Next Step: Run the SQL migration with your 3 admin emails!**
