# Real-Time Sync Testing Guide

## Quick Summary of Fixes

### 1. Homepage Now Shows ALL Braiders ✅
- **Fixed**: `supabaseBraiderStore.getAllProfiles()` now loads all braiders (verified + unverified + validation)
- **Result**: New customers see registered braiders immediately on homepage
- **Real-time**: Updates every 5 seconds + real-time subscriptions

### 2. Portfolio Page Error Handling ✅
- **Fixed**: Added comprehensive error handling and loading states
- **Result**: Users see helpful error messages instead of blank pages
- **Fallback**: Navigation options to dashboard or login

---

## Testing Scenarios

### Scenario 1: New Braider Registration & Visibility
**Objective**: Verify newly registered braiders appear on customer homepage

**Steps**:
1. Open Browser A (Chrome/Firefox)
2. Navigate to `http://localhost:3000/signup/braider`
3. Fill in braider signup form:
   - Email: `braider1@test.com`
   - Password: `Test123!`
   - Full Name: `Test Braider`
   - Bio: `Professional braider`
   - Experience: `5 years`
   - Specialties: Select "Box Braids"
4. Click "Sign Up"
5. Wait for redirect to dashboard

6. Open Browser B (Incognito/Private)
7. Navigate to `http://localhost:3000`
8. Scroll to "Featured Braiders" section
9. **Expected**: See "Test Braider" in the carousel within 5 seconds
10. **Verify**: Braider shows even if verification status is "unverified"

**Success Criteria**:
- ✅ Braider appears in featured section
- ✅ Braider name and bio are visible
- ✅ Rating shows as 5.0 (default)
- ✅ "View Profile" button is clickable

---

### Scenario 2: Portfolio Page Access & Error Handling
**Objective**: Verify portfolio page loads correctly and handles errors

**Steps**:
1. Sign in as braider (from Scenario 1)
2. Navigate to `/braider/portfolio`
3. **Expected**: Page loads without errors
4. **Verify**: "Add Portfolio Item" button is visible and clickable

**Error Handling Test**:
1. Sign in as customer
2. Try to access `/braider/portfolio` directly
3. **Expected**: See "Access Denied" error message
4. **Verify**: "Go to Login" button is visible
5. Click button and verify redirect to login page

**Success Criteria**:
- ✅ Portfolio page loads for braiders
- ✅ Error message displays for non-braiders
- ✅ Navigation buttons work correctly
- ✅ No console errors

---

### Scenario 3: Real-Time Sync Across Browsers
**Objective**: Verify real-time updates work across multiple browser sessions

**Steps**:
1. Open Browser A and sign in as braider
2. Open Browser B and sign in as customer
3. Keep homepage open on Browser B
4. On Browser A, navigate to `/braider/portfolio`
5. Click "Add Portfolio Item"
6. Fill in form:
   - Title: "Test Portfolio"
   - Style: "Box Braids"
   - Description: "Test description"
   - Upload an image
7. Click "Add Item"
8. **Expected**: Success message appears

9. On Browser B, refresh homepage or wait 5 seconds
10. **Expected**: Portfolio item appears in braider's profile
11. Click "View Profile" on braider card
12. **Expected**: Portfolio item is visible

**Success Criteria**:
- ✅ Portfolio item syncs to other sessions
- ✅ No manual refresh needed (within 5 seconds)
- ✅ Real-time subscription updates work

---

### Scenario 4: Multiple Braiders Registration
**Objective**: Verify multiple braiders appear correctly

**Steps**:
1. Repeat Scenario 1 with different braiders:
   - `braider2@test.com` - "Braider Two"
   - `braider3@test.com` - "Braider Three"
2. Keep customer homepage open
3. Register each braider in separate browser tabs
4. **Expected**: All braiders appear in carousel within 5 seconds

**Success Criteria**:
- ✅ All braiders appear in featured section
- ✅ Carousel navigation works (prev/next buttons)
- ✅ Carousel dots show correct number of pages
- ✅ Auto-rotation works every 5 seconds

---

### Scenario 5: Search & Filter Functionality
**Objective**: Verify search and filters work with all braiders

**Steps**:
1. Sign in as customer
2. Navigate to `/customer/dashboard`
3. In "Browse Braiders" tab:
   - Search for braider name
   - Filter by specialty
   - Filter by rating
   - Filter by price
4. **Expected**: Results update in real-time
5. **Verify**: All registered braiders appear in results

**Success Criteria**:
- ✅ Search finds all braiders
- ✅ Filters work correctly
- ✅ Results update without page reload
- ✅ "Clear Filters" button works

---

## Debugging Checklist

If tests fail, check:

### Homepage Not Showing Braiders
- [ ] Check browser console for errors
- [ ] Verify Supabase connection: `supabase.auth.getSession()`
- [ ] Check if `braider_profiles` table has data: 
  ```sql
  SELECT COUNT(*) FROM braider_profiles;
  ```
- [ ] Verify real-time subscription is active
- [ ] Check if `getAllProfiles()` is being called

### Portfolio Page Errors
- [ ] Check browser console for errors
- [ ] Verify user is authenticated: `useSupabaseAuthStore().user`
- [ ] Verify user role is 'braider'
- [ ] Check if profile exists in store
- [ ] Verify image upload is working

### Real-Time Sync Not Working
- [ ] Check Supabase real-time is enabled
- [ ] Verify subscription is active in browser DevTools
- [ ] Check if `subscribeToProfiles()` is being called
- [ ] Verify database changes are being made
- [ ] Check for network errors in DevTools

---

## Console Commands for Testing

```javascript
// Check current user
useSupabaseAuthStore.getState().user

// Check braiders in store
useSupabaseBraiderStore.getState().profiles

// Check if subscription is active
useSupabaseBraiderStore.getState().subscriptionUnsubscribe

// Manually trigger profile refresh
useSupabaseBraiderStore.getState().getAllProfiles()

// Check for errors
useSupabaseBraiderStore.getState().error
```

---

## Expected Behavior After Fixes

### Homepage
- Shows all registered braiders (verified + unverified)
- Updates every 5 seconds
- Real-time subscription active
- Carousel works smoothly
- No console errors

### Portfolio Page
- Loads without errors for braiders
- Shows helpful error for non-braiders
- Can add/remove portfolio items
- Images upload correctly
- Changes sync to other sessions

### Customer Dashboard
- Shows all available braiders
- Search and filters work
- Real-time updates
- Bookings display correctly
- No console errors

---

## Performance Notes

- Real-time subscriptions use Supabase Realtime API
- Homepage refreshes every 5 seconds (configurable)
- Carousel auto-rotates every 5 seconds
- All operations are optimized for mobile
- No unnecessary re-renders

---

## Next Steps After Testing

1. If all tests pass:
   - Deploy to production
   - Monitor error logs
   - Gather user feedback

2. If tests fail:
   - Check debugging checklist
   - Review console errors
   - Check Supabase logs
   - Verify database schema

3. Performance optimization:
   - Adjust refresh intervals if needed
   - Monitor real-time subscription performance
   - Optimize carousel rendering
   - Consider pagination for large datasets
