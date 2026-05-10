# Admin Role Access Fix - Complete Guide

## Problem Summary
Admin emails were being set in the database with `role = 'admin'`, but users with those emails couldn't access the admin dashboard. They were redirected to the signup dashboard instead.

**Root Cause**: After the SQL migration updated the role to 'admin', users needed to log in again to fetch the fresh role from the database. The app was caching the old role in localStorage.

---

## Solution Implemented

### 1. **New Role Refresh Endpoint** ✅
- **File**: `app/api/auth/refresh-role/route.ts`
- **Purpose**: Fetches the user's current role directly from the database
- **When Called**: When user tries to access admin dashboard but role is not 'admin'

### 2. **Enhanced Auth Store** ✅
- **File**: `store/supabaseAuthStore.ts`
- **New Method**: `refreshRole()`
- **Purpose**: Calls the refresh endpoint and updates the user's role in state and localStorage

### 3. **Improved Admin Layout** ✅
- **File**: `app/(admin)/layout.tsx`
- **Changes**:
  - Attempts to refresh role before denying access
  - Shows clear error message if user is not admin
  - Provides better loading and error states
  - Automatically redirects after 3 seconds if access denied

---

## How It Works Now

### When Admin User Logs In:
1. User enters email/password on login page
2. Login endpoint fetches fresh role from database
3. Role is stored in auth state and localStorage
4. User is redirected to appropriate dashboard based on role

### When Admin User Tries to Access `/admin`:
1. Admin layout checks if user has `role === 'admin'`
2. If yes → Dashboard loads ✅
3. If no → Attempts to refresh role from database
4. If role is now 'admin' → Dashboard loads ✅
5. If still not admin → Shows error and redirects to login

---

## Step-by-Step Setup

### Step 1: Run SQL Migration (if not done yet)
Go to Supabase SQL Editor and run:

```sql
-- Make 3 users admin by email
UPDATE profiles 
SET role = 'admin' 
WHERE email IS NOT NULL AND email IN (
  'your-email-1@gmail.com',
  'your-email-2@gmail.com', 
  'your-email-3@gmail.com'
);
```

**Replace the emails with your actual admin emails!**

### Step 2: Code is Already Deployed ✅
- Changes committed to master: `7ad7edc`
- Vercel auto-deployment triggered
- New endpoints available in production

### Step 3: Test Admin Access

#### Test 1: Fresh Login
1. Go to http://localhost:3001/login (or your production URL)
2. Log in with one of your admin emails
3. You should be redirected to `/admin` dashboard
4. ✅ If you see the admin dashboard, it's working!

#### Test 2: Existing Session
If you were already logged in before the fix:
1. Clear browser cache/localStorage:
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Delete `braidmee_auth_session` and `braidmee_user`
2. Refresh the page
3. Log in again with your admin email
4. ✅ You should now see the admin dashboard

#### Test 3: Non-Admin User
1. Log in with a non-admin email
2. Try to access `/admin`
3. You should see error: "Your account role is 'customer', not 'admin'"
4. ✅ Redirected to login after 3 seconds

---

## Verification Checklist

- [ ] SQL migration run with your 3 admin emails
- [ ] Code deployed to production (check Vercel)
- [ ] Fresh login with admin email works
- [ ] Admin dashboard loads without redirect
- [ ] Non-admin users see error message
- [ ] Mobile notifications still working (from previous fix)
- [ ] Password reset emails still working (from previous fix)

---

## Troubleshooting

### Issue: Still seeing signup dashboard instead of admin dashboard

**Solution 1: Clear Cache**
- Open DevTools (F12)
- Application → Local Storage
- Delete `braidmee_auth_session` and `braidmee_user`
- Refresh page and log in again

**Solution 2: Verify SQL Update**
- Go to Supabase Dashboard
- Open SQL Editor
- Run: `SELECT email, role FROM profiles WHERE role = 'admin';`
- Verify your 3 admin emails show with `role = 'admin'`

**Solution 3: Check Logs**
- Open browser DevTools Console (F12)
- Look for messages like:
  - `✅ Admin access granted` (good)
  - `User role is customer, not admin` (need to update SQL)
  - `Role refreshed: admin` (role was updated)

### Issue: Getting "Profile not found" error

**Solution**: 
- Verify user exists in Supabase Auth
- Verify user has a profile record in `profiles` table
- Check that `profiles.role` column exists

### Issue: Emails not sending

This is a separate issue from admin access. See `PASSWORD_RESET_FINAL_STATUS.md` for email setup.

---

## What Changed in Code

### New File: `app/api/auth/refresh-role/route.ts`
- POST endpoint that fetches user's current role from database
- Returns updated user object with fresh role

### Modified: `store/supabaseAuthStore.ts`
- Added `refreshRole()` method
- Calls `/api/auth/refresh-role` endpoint
- Updates user state and localStorage

### Modified: `app/(admin)/layout.tsx`
- Enhanced access check logic
- Attempts role refresh before denying access
- Better error messaging and loading states
- Graceful redirect with 3-second delay

### Modified: `app/api/auth/login/route.ts`
- Added logging for debugging
- Ensures fresh role is always fetched from database

---

## Next Steps

1. **Verify Admin Access Works**
   - Test with each of your 3 admin emails
   - Confirm dashboard loads without redirect

2. **Verify Email System** (if not done)
   - Test password reset flow
   - Check Resend domain verification
   - See `PASSWORD_RESET_FINAL_STATUS.md`

3. **Verify Mobile Notifications** (if not done)
   - Test on mobile device
   - See `MOBILE_NOTIFICATIONS_AND_ADMIN_FIX.md`

4. **Monitor Production**
   - Check Vercel deployment status
   - Monitor error logs for any issues

---

## Summary

✅ **Admin role access is now fixed!**

The system now:
- Fetches fresh role from database on login
- Attempts to refresh role if access denied
- Provides clear error messages
- Automatically redirects after errors
- Works with existing password reset and notification systems

**Users with admin role in the database will now be able to access the admin dashboard.**
