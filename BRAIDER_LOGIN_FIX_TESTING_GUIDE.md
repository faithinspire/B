# Braider Login Fix - Testing Guide

## Overview
This guide walks through testing the braider login fix to ensure braiders see the correct dashboard.

## Prerequisites
- Access to Supabase dashboard
- Test braider account(s)
- Test customer account(s)
- Browser developer tools (F12)

## Database Fix (REQUIRED FIRST)

### Step 1: Run SQL Fix in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query and run:

```sql
-- Fix braider roles in profiles table
UPDATE profiles 
SET role = 'braider', updated_at = NOW()
WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles)
AND role != 'braider';

-- Verify the fix
SELECT COUNT(*) as braiders_with_correct_role FROM profiles 
WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles)
AND role = 'braider';
```

3. Verify the result shows the correct count of braiders

### Step 2: Verify Database State
Run this query to check all braiders:

```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  bp.verification_status
FROM profiles p
LEFT JOIN braider_profiles bp ON p.id = bp.user_id
WHERE p.id IN (SELECT DISTINCT user_id FROM braider_profiles)
ORDER BY p.created_at DESC
LIMIT 10;
```

Expected result: All braiders should have `role = 'braider'`

## Testing Existing Braider Login

### Test Case 1: Existing Braider Login
1. Open browser and go to login page
2. Open Developer Tools (F12) → Console tab
3. Log in with an existing braider account
4. Watch the console for these logs:
   - `=== AUTH STORE: User signed in ===`
   - `=== AUTH STORE: Profile fetched ===` (should show `role: 'braider'`)
   - `=== LOGIN FORM: User role after login ===` (should show `role: 'braider'`)
   - `=== LOGIN FORM: Redirecting braider to /braider/dashboard ===`

5. Verify you're redirected to `/braider/dashboard`
6. Verify the dashboard shows braider-specific content (services, bookings, etc.)

### Test Case 2: Existing Customer Login
1. Log out
2. Log in with a customer account
3. Watch the console for:
   - `=== AUTH STORE: Profile fetched ===` (should show `role: 'customer'`)
   - `=== LOGIN FORM: Redirecting customer to /dashboard ===`

4. Verify you're redirected to `/dashboard`
5. Verify the dashboard shows customer-specific content (browse braiders, bookings, etc.)

## Testing New Braider Signup

### Test Case 3: New Braider Signup
1. Go to signup page
2. Click "Sign up as Braider"
3. Complete all signup steps:
   - Basic Info (name, email, phone, password)
   - Location (state, city, address, next of kin)
   - Professional (specialization, experience, services, bio)
   - Verification (ID type, ID number, ID document)
   - Review and submit

4. After signup, watch the console for:
   - `=== AUTH STORE: Setting user with role ===` (should show `role: 'braider'`)
   - `=== LOGIN FORM: Redirecting braider to /braider/dashboard ===`

5. Verify you're redirected to `/braider/dashboard`
6. Verify the dashboard loads correctly

### Test Case 4: New Customer Signup
1. Go to signup page
2. Click "Sign up as Customer"
3. Complete signup (email, password, name)
4. After signup, verify you're redirected to `/dashboard`

## Testing Role-Based Redirect

### Test Case 5: Braider Accessing Customer Dashboard
1. Log in as braider
2. Manually navigate to `/dashboard`
3. Watch console for:
   - `=== ROLE REDIRECT: Braider on non-braider page, redirecting ===`

4. Verify you're redirected back to `/braider/dashboard`

### Test Case 6: Customer Accessing Braider Dashboard
1. Log in as customer
2. Manually navigate to `/braider/dashboard`
3. Watch console for:
   - `=== ROLE REDIRECT: Customer on braider dashboard, redirecting ===`

4. Verify you're redirected back to `/dashboard`

## Troubleshooting

### Issue: Braider still sees customer dashboard
**Solution:**
1. Check browser console for error logs
2. Verify database fix was applied (run verification query)
3. Check if profile.role is actually 'braider' in database
4. Clear browser cache and try again
5. Check if RLS policies are blocking profile reads

### Issue: Redirect loop
**Solution:**
1. Check console for redirect logs
2. Verify pathname is correct
3. Clear browser cache
4. Check if there's a conflict with other redirects

### Issue: Login fails
**Solution:**
1. Check console for auth errors
2. Verify email/password are correct
3. Check if user exists in database
4. Verify Supabase connection is working

## Console Log Reference

### Auth Store Logs
- `=== AUTH STORE: User signed in ===` - User authenticated
- `=== AUTH STORE: Profile fetched ===` - Profile retrieved from database
- `=== AUTH STORE: Final role determination ===` - Role determined from profile or auth metadata
- `=== AUTH STORE: Setting user with role ===` - User state updated with role

### Login Form Logs
- `=== LOGIN FORM: User role after login ===` - Role after login
- `=== LOGIN FORM: Found braider_profiles record ===` - Fallback check found braider record
- `=== LOGIN FORM: Redirecting braider to /braider/dashboard ===` - Braider redirect
- `=== LOGIN FORM: Redirecting customer to /dashboard ===` - Customer redirect
- `=== LOGIN FORM: Redirecting admin to /admin ===` - Admin redirect

### Role Redirect Logs
- `=== ROLE REDIRECT: Checking redirect ===` - Redirect check started
- `=== ROLE REDIRECT: On public path, skipping redirect ===` - Public path, no redirect
- `=== ROLE REDIRECT: On homepage, redirecting based on role ===` - Homepage redirect
- `=== ROLE REDIRECT: Braider on non-braider page, redirecting ===` - Braider redirect
- `=== ROLE REDIRECT: Customer on braider dashboard, redirecting ===` - Customer redirect

## Verification Checklist

- [ ] Database fix applied (all braiders have role='braider')
- [ ] Existing braider can log in
- [ ] Existing braider sees braider dashboard
- [ ] Existing braider console shows correct role logs
- [ ] New braider signup works
- [ ] New braider redirected to braider dashboard
- [ ] Customer login still works
- [ ] Customer sees customer dashboard
- [ ] Admin login still works (if applicable)
- [ ] Role-based redirects work correctly
- [ ] No redirect loops
- [ ] No console errors

## Next Steps
1. Deploy changes to Vercel: `git push origin master`
2. Test on production environment
3. Monitor for any issues
4. Collect feedback from users
