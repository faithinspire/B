# Test Braiders Display & Booking System

## Current Status
✅ Dev server running on http://localhost:3001

## What to Check

### 1. Homepage - Featured Braiders Section
**URL**: http://localhost:3001

**Steps**:
1. Open the URL in your browser
2. Scroll down to the "Featured Braiders" section
3. Look for:
   - Carousel with braider cards
   - Each card showing: name, bio, rating, verification status
   - Navigation arrows (if more than 4 braiders)
   - Carousel dots at the bottom

**Expected Result**:
- ✅ Should see braider cards displaying
- ✅ Each card has: name, bio, rating, "View Profile" button
- ✅ Carousel navigation works

**If NOT showing**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs starting with `=== HOMEPAGE:` or `=== HOOK:`
4. Check Network tab for `/api/braiders` request
5. Verify response contains braider data

---

### 2. Search Braiders
**URL**: http://localhost:3001

**Steps**:
1. On homepage, use the search bar at the top
2. Enter a location or select a braiding style
3. Click "Find Braiders" button

**Expected Result**:
- ✅ Should navigate to `/search` page
- ✅ Should display list of braiders matching search criteria
- ✅ Each braider card should be clickable

**If NOT working**:
1. Check if search page exists at `/search`
2. Check Network tab for API calls
3. Look for error messages in console

---

### 3. Browse All Braiders
**URL**: http://localhost:3001/search

**Steps**:
1. Go directly to search page
2. Should see list of all braiders

**Expected Result**:
- ✅ Should display grid/list of braiders
- ✅ Each braider card shows: name, rating, bio, location
- ✅ Can click on braider to view profile

---

### 4. View Braider Profile
**Steps**:
1. Click on any braider card (from Featured or Search)
2. Should navigate to `/braider/[user_id]`

**Expected Result**:
- ✅ Should show braider profile page
- ✅ Shows: name, bio, rating, services, portfolio
- ✅ "Book Now" or "Book Service" button visible

---

### 5. Book a Braider
**Steps**:
1. On braider profile page, click "Book Now" button
2. Should show booking form

**Expected Result**:
- ✅ Should navigate to booking page
- ✅ Shows: service selection, date/time picker, price
- ✅ Can proceed to payment

---

### 6. Admin Dashboard
**URL**: http://localhost:3001/admin/dashboard

**Steps**:
1. Login with admin account (if available)
2. Should see admin dashboard

**Expected Result**:
- ✅ Should show admin dashboard (NOT customer dashboard)
- ✅ Shows stats: total users, braiders, customers, bookings, revenue
- ✅ Navigation buttons visible

---

### 7. Admin Users Page
**URL**: http://localhost:3001/admin/users

**Steps**:
1. On admin dashboard, click "Users" button
2. Should show users table

**Expected Result**:
- ✅ Should display table with columns: Name, Email, Role, Joined, Phone
- ✅ Should show all users
- ✅ Search and filter should work

---

## Browser Console Logs to Check

### For Braiders Display
Look for these logs:
```
=== HOOK: Fetch attempt #1 (force=true) ===
=== HOOK: Fetching from /api/braiders?t=... ===
=== HOOK: Response status 200 ===
=== HOOK: Received X braiders ===
=== HOMEPAGE: Braiders data received ===
=== HOMEPAGE: Featured braiders after filter ===
```

### For API Errors
Look for these error logs:
```
=== HOOK: Error on attempt #X ===
=== HOMEPAGE: Error loading braiders ===
=== API: Error fetching braiders ===
```

---

## Network Tab Checks

### Check `/api/braiders` Response
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for request to `/api/braiders`
5. Click on it and check Response tab
6. Should see array of braider objects with fields:
   - `id`, `user_id`, `full_name`, `email`
   - `avatar_url`, `bio`, `rating_avg`, `rating_count`
   - `verification_status`, `is_premium`, `featured_order`
   - `latitude`, `longitude`

---

## Database Check

### Verify Columns Exist
1. Go to Supabase Dashboard: https://app.supabase.com/project/gymgxcspjysrkluxyavd/editor
2. Click on `braider_profiles` table
3. Scroll right to see all columns
4. Should see: `is_premium`, `featured_order`, `latitude`, `longitude`

---

## Quick Checklist

- [ ] Dev server running on http://localhost:3001
- [ ] Homepage loads without errors
- [ ] Featured Braiders section visible
- [ ] Braider cards display with data
- [ ] Carousel navigation works
- [ ] Search functionality works
- [ ] Can view braider profile
- [ ] Can click "Book Now" button
- [ ] Admin dashboard shows correct page
- [ ] Admin users page displays all users
- [ ] No errors in browser console
- [ ] API responses contain all expected fields

---

## If Braiders Are NOT Showing

### Step 1: Check Database Migration
1. Go to Supabase: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new
2. Run this SQL:
```sql
ALTER TABLE braider_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE INDEX IF NOT EXISTS idx_braider_profiles_featured 
  ON braider_profiles(is_premium DESC, featured_order DESC, rating_avg DESC);

SELECT 'Done!' AS status;
```

### Step 2: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Clear Browser Cache
1. Press Ctrl+Shift+Delete
2. Clear all cache
3. Refresh page

### Step 4: Check API Response
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for `/api/braiders` request
5. Check response - should contain braider data

---

## Success Indicators

✅ **Braiders are displaying when:**
1. Featured Braiders section shows braider cards
2. Each card has: name, bio, rating, verification status
3. Carousel navigation works
4. Can click "View Profile" to see braider details
5. Can click "Book Now" to start booking

✅ **Booking system is working when:**
1. Can navigate to braider profile
2. Can click "Book Now" button
3. Can select service and date/time
4. Can proceed to payment

✅ **Admin system is working when:**
1. Admin users see admin dashboard (not customer page)
2. Admin dashboard shows stats
3. Admin users page displays all users with phone numbers
4. Search and filter work on users page

---

## Next Steps

1. **Test the homepage**: Open http://localhost:3001 and check if braiders display
2. **Check console logs**: Look for any error messages
3. **Check Network tab**: Verify `/api/braiders` returns data
4. **If not working**: Run database migration SQL
5. **Restart dev server**: Stop and restart npm run dev
6. **Test again**: Refresh page and check if braiders display

---

**Status**: Ready to test
**Dev Server**: Running on http://localhost:3001
**Time to Test**: 5 minutes
