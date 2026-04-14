# Quick Test Guide: Braider Dashboard Hard Fix

## What Was Fixed

Newly registered braiders were showing the customer dashboard instead of the braider dashboard on first login. This is now fixed.

---

## Quick Test (5 minutes)

### Test 1: New Braider Signup & Login
1. Go to signup page
2. Click "Sign up as Braider"
3. Fill in details and sign up
4. **Immediately** log in (don't wait)
5. **Expected**: See braider dashboard (not customer dashboard)
6. **Check**: Open browser console → look for "=== ROLE REDIRECT:" logs

### Test 2: New Customer Signup & Login
1. Go to signup page
2. Click "Sign up as Customer"
3. Fill in details and sign up
4. **Immediately** log in
5. **Expected**: See customer dashboard
6. **Check**: Console logs should show role verification

### Test 3: Existing Braider Login
1. Log in with an existing braider account
2. **Expected**: See braider dashboard
3. **Check**: No unnecessary redirects in console

---

## What to Look For in Console

### Good Signs ✅
```
=== AUTH STORE: Profile not found but auth metadata says braider, trusting auth metadata ===
=== ROLE REDIRECT: Verifying role for user ===
=== ROLE REDIRECT: Role verification result === {correctRole: "braider"}
```

### Bad Signs ❌
```
=== ROLE REDIRECT: Redirecting to customer dashboard ===
(when user is a braider)

Errors in /api/auth/verify-role endpoint
```

---

## If Something Goes Wrong

### Issue: Braider sees customer dashboard
- Check console for role verification logs
- Verify user has braider_profiles record in database
- Check if profile.role is set to 'braider' in database

### Issue: Infinite redirects
- Clear browser cache and cookies
- Check if role verification endpoint is working
- Verify Supabase credentials are correct

### Issue: Slow dashboard loading
- This is normal - role verification takes ~100-200ms
- If it takes >2 seconds, check network tab in console

---

## Deployment Checklist

- [ ] Code pushed to master (commit 34afb82)
- [ ] Deployed to Vercel
- [ ] Test new braider signup
- [ ] Test new customer signup
- [ ] Test existing braider login
- [ ] Check console logs for verification
- [ ] Monitor for 24 hours for issues

---

## Key Files Modified

1. `store/supabaseAuthStore.ts` - Trusts auth metadata when profile not found
2. `app/components/RoleBasedRedirect.tsx` - Verifies role on first load
3. `app/api/auth/verify-role/route.ts` - Checks correct role from database
4. `app/api/auth/refresh-role/route.ts` - Refreshes role from database

---

## Expected Behavior

### Before Fix ❌
```
Sign up as braider → Log in → See customer dashboard
```

### After Fix ✅
```
Sign up as braider → Log in → See braider dashboard
```

---

## Questions?

Check the full documentation in `ACTION_CARD_BRAIDER_DASHBOARD_HARD_FIX_COMPLETE.md`
