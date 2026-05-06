# Complete System Verification Guide

## Overview
This guide walks you through verifying that all three main issues are fixed:
1. ✅ Braiders displaying on homepage Featured Braiders section
2. ✅ Admin dashboard showing customer data
3. ✅ Admin users page displaying all user details

---

## STEP 1: Database Migration (CRITICAL)

### Action Required
Run this SQL in Supabase Dashboard: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

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

SELECT 'Migration complete' AS status;
```

### Expected Result
You should see "Migration complete" message.

---

## STEP 2: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

The server should start on http://localhost:3001

---

## STEP 3: Test Braiders Display on Homepage

### Test Case 1: Featured Braiders Section
1. Open http://localhost:3001 in browser
2. Scroll down to "Featured Braiders" section
3. **Expected**: You should see a carousel with braider cards showing:
   - Braider avatar/image
   - Full name
   - Bio
   - Rating (stars and count)
   - Verification status badge
   - "View Profile" button

### Test Case 2: Carousel Navigation
1. If there are more than 4 braiders, you should see:
   - Left/right arrow buttons
   - Carousel dots at the bottom
2. Click arrows to navigate through braiders
3. **Expected**: Carousel should smoothly scroll to show next/previous braiders

### Test Case 3: Braider Profile Link
1. Click "View Profile" button on any braider card
2. **Expected**: Should navigate to `/braider/[user_id]` page showing full braider profile

### Debugging if Braiders Don't Show
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs starting with `=== HOMEPAGE:` or `=== HOOK:`
4. Check if you see:
   - `=== HOOK: Received X braiders ===` (should show count > 0)
   - `=== HOMEPAGE: Featured braiders after filter ===` (should show count > 0)
5. If count is 0, check Network tab:
   - Look for `/api/braiders` request
   - Check response - should contain array of braider objects with all fields

---

## STEP 4: Test Admin Dashboard

### Test Case 1: Admin Login
1. Go to http://localhost:3001/login
2. Sign in with admin account (if you have one)
3. **Expected**: Should redirect to `/admin/dashboard` (NOT customer dashboard)

### Test Case 2: Dashboard Stats Display
1. On admin dashboard, you should see:
   - Total Users count
   - Total Braiders count
   - Total Customers count
   - Conversations count
   - Bookings count
   - Revenue total
2. **Expected**: All stats should display numbers (not errors)

### Test Case 3: Navigation Buttons
1. You should see 6 navigation buttons:
   - Overview (current page)
   - Bookings
   - Payments
   - Users
   - Disputes
   - (any others)
2. Click "Users" button
3. **Expected**: Should navigate to `/admin/users` page

### Debugging if Admin Dashboard Shows Customer Dashboard
1. Check browser console for logs starting with `=== ADMIN DASHBOARD:`
2. Look for: `=== ADMIN DASHBOARD: User role ===` - should show `admin`
3. If it shows `customer` or `braider`, role detection is broken
4. Check auth store logs: `=== AUTH STORE: Setting user with role ===`

---

## STEP 5: Test Admin Users Page

### Test Case 1: Users List Display
1. Go to http://localhost:3001/admin/users
2. You should see a table with columns:
   - Name
   - Email
   - Role (with colored badges)
   - Joined date
   - Phone

### Test Case 2: User Data Completeness
1. Look at the table rows
2. **Expected**: Each user should have:
   - Full name (not UUID)
   - Email address
   - Role badge (Admin/Braider/Customer)
   - Join date
   - Phone number (if available)

### Test Case 3: Search and Filter
1. Type a name in the search box
2. **Expected**: Table should filter to show matching users
3. Select a role from dropdown
4. **Expected**: Table should filter to show only that role

### Test Case 4: Braider Details
1. Find a braider in the list
2. **Expected**: Should show:
   - Full name
   - Email
   - Role: "braider"
   - Phone (if available)
   - Verification status (if braider profile exists)

### Debugging if Users Don't Show
1. Open browser console
2. Check Network tab for `/api/admin/users` request
3. Check response - should be array of user objects
4. Each user should have: `id`, `email`, `full_name`, `phone`, `role`

---

## STEP 6: Verify API Responses

### Check Braiders API
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh homepage
4. Look for request to `/api/braiders`
5. Click on it and check Response tab
6. **Expected**: Should see array of braider objects with fields:
   ```json
   [
     {
       "id": "...",
       "user_id": "...",
       "full_name": "Braider Name",
       "email": "braider@example.com",
       "avatar_url": "...",
       "bio": "...",
       "rating_avg": 4.5,
       "rating_count": 10,
       "verification_status": "verified",
       "is_premium": false,
       "featured_order": 0,
       "latitude": null,
       "longitude": null,
       ...
     }
   ]
   ```

### Check Admin Users API
1. Go to `/admin/users` page
2. Open Network tab
3. Look for request to `/api/admin/users`
4. Check Response tab
5. **Expected**: Should see array of user objects with fields:
   ```json
   [
     {
       "id": "...",
       "email": "user@example.com",
       "full_name": "User Name",
       "phone": "...",
       "role": "customer",
       "avatar_url": "...",
       "braiderProfile": null or {...}
     }
   ]
   ```

---

## STEP 7: Verify Database Columns

### Check if Columns Were Added
1. Go to Supabase Dashboard: https://app.supabase.com/project/gymgxcspjysrkluxyavd/editor
2. Click on `braider_profiles` table
3. Scroll right to see all columns
4. **Expected**: Should see these columns:
   - `is_premium` (BOOLEAN)
   - `featured_order` (INTEGER)
   - `latitude` (DECIMAL)
   - `longitude` (DECIMAL)

5. Click on `profiles` table
6. **Expected**: Should see these columns:
   - `phone` (TEXT)
   - `bio` (TEXT)

---

## STEP 8: Full End-to-End Test

### Complete User Journey
1. **Homepage**: Braiders display in Featured section ✓
2. **Click braider profile**: Navigate to braider detail page ✓
3. **Admin login**: Redirect to admin dashboard (not customer) ✓
4. **Admin dashboard**: Stats display correctly ✓
5. **Click Users button**: Navigate to users page ✓
6. **Users page**: All users display with complete data ✓
7. **Search/filter**: Works correctly ✓

---

## Troubleshooting Checklist

- [ ] Database migration SQL ran successfully
- [ ] Dev server restarted after migration
- [ ] Braiders show on homepage (check console logs)
- [ ] Admin dashboard shows stats (not errors)
- [ ] Admin users page displays all users
- [ ] API responses contain all expected fields
- [ ] No 401/403 errors in Network tab
- [ ] No TypeScript errors in console

---

## Common Issues and Solutions

### Issue: Braiders not showing on homepage
**Solution**: 
1. Check if migration SQL ran successfully
2. Verify `/api/braiders` returns data in Network tab
3. Check browser console for error logs
4. Restart dev server

### Issue: Admin dashboard shows customer dashboard
**Solution**:
1. Check if user role is set to 'admin' in profiles table
2. Clear browser cache and hard refresh (Ctrl+Shift+R)
3. Check auth store logs for role detection
4. Verify Supabase credentials in .env.local

### Issue: Admin users page shows no data
**Solution**:
1. Check if `/api/admin/users` returns data
2. Verify auth token is being sent in request headers
3. Check if user is actually admin
4. Look for 401/403 errors in Network tab

### Issue: Phone numbers not showing in admin users
**Solution**:
1. Verify `phone` column was added to `profiles` table
2. Check if user profiles have phone data populated
3. Verify API response includes `phone` field

---

## Success Criteria

✅ **All three issues are fixed when:**
1. Braiders display on homepage Featured Braiders section
2. Admin users see admin dashboard (not customer dashboard)
3. Admin users page shows all users with complete data (name, email, role, phone)
4. All API responses contain expected fields
5. No errors in browser console or Network tab

---

## Next Steps

After verification:
1. Commit changes to Git: `git add . && git commit -m "Fix braiders display and admin dashboard"`
2. Push to master: `git push origin master`
3. Vercel will auto-deploy
4. Test on production URL

---

**Last Updated**: April 9, 2026
**Status**: Ready for testing
