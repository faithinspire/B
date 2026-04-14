# Quick Test Guide - Session 8 Fixes

## Test 1: Braider Verification Page

**Steps:**
1. Sign in as a braider
2. Navigate to `/braider/verify`
3. Verify the page loads without "Failed to fetch braiders" error
4. Check browser console for role verification logs

**Expected Result:** ✅ Page loads successfully with verification form

---

## Test 2: Admin Users Delete Functionality

**Steps:**
1. Sign in as admin
2. Navigate to `/admin/users`
3. Click "View Details" on any user
4. Click "Delete User" button in modal footer
5. Confirm deletion in dialog

**Expected Result:** ✅ User is deleted and removed from list

---

## Test 3: Admin Send Message

**Steps:**
1. Sign in as admin
2. Navigate to `/admin/users`
3. Click "View Details" on any user
4. Type a message in the message input
5. Click "Send" button

**Expected Result:** ✅ Message is sent and appears in message list

---

## Test 4: Newly Registered Braider Dashboard

**Steps:**
1. Sign up as a new braider (complete all steps)
2. After signup, you should be redirected to `/braider/dashboard`
3. Verify you see the braider dashboard (not customer dashboard)
4. Check browser console for role verification logs

**Expected Result:** ✅ Braider dashboard loads (not customer dashboard)

---

## Test 5: Existing Braider Login

**Steps:**
1. Sign in as an existing braider
2. Verify you see the braider dashboard
3. Check browser console for role verification logs

**Expected Result:** ✅ Braider dashboard loads correctly

---

## Browser Console Logs to Look For

### Successful Role Verification:
```
=== AUTH STORE: Session check === {hasSession: true, userId: "...", authRole: "braider"}
=== AUTH STORE: Auth metadata role === {authRole: "braider"}
=== AUTH STORE: Profile found === {role: "braider", email: "..."}
=== AUTH STORE: Final role determination === {profileRole: "braider", authRole: "braider", isBraider: false, finalRole: "braider", email: "..."}
```

### Profile Not Found Yet (New User):
```
=== AUTH STORE: Profile not found on attempt 1
=== AUTH STORE: Profile not found on attempt 2
...
=== AUTH STORE: Profile not found, checking braider_profiles ===
=== AUTH STORE: Profile not found but auth metadata says braider, using braider ===
=== AUTH STORE: Final role determination === {profileRole: undefined, authRole: "braider", isBraider: false, finalRole: "braider", email: "..."}
```

### Ensure Profile Call:
```
Profile ensured: {success: true, action: "created", message: "Profile created with role braider"}
```

---

## Troubleshooting

### Issue: Still seeing customer dashboard after braider signup

**Check:**
1. Browser console for role verification logs
2. Verify auth metadata has role='braider'
3. Check if profile was created with correct role
4. Try refreshing the page

**Solution:**
- Clear browser cache and cookies
- Try signing out and signing back in
- Check database directly to verify profile role

### Issue: Admin delete button not working

**Check:**
1. Browser console for errors
2. Network tab to see if DELETE request is being sent
3. Verify user is admin role

**Solution:**
- Refresh the page
- Try a different user
- Check browser console for specific error message

### Issue: Admin send message not working

**Check:**
1. Browser console for errors
2. Network tab to see if POST request is being sent
3. Verify message text is not empty

**Solution:**
- Refresh the page
- Try a different message
- Check browser console for specific error message

---

## Success Indicators

✅ All 4 issues are fixed when:
1. Braider verification page loads without errors
2. Admin can delete users
3. Admin can send messages
4. Newly registered braiders see braider dashboard (not customer)

---

## Rollback Plan

If issues occur:
1. Revert to previous commit: `git revert a02c3f8`
2. Push to master: `git push origin master`
3. Redeploy to Vercel

---

## Notes

- All changes are backward compatible
- No database migrations required
- Safe to test in production
- Monitor browser console for any errors
