# 🔧 ADMIN PAGE FIX — SHOWING CUSTOMER PAGE

## Problem

Admin is seeing the customer dashboard instead of the admin dashboard at `/admin`.

## Root Cause

The admin user's profile in the database has the wrong role. The auth system checks the `profiles` table for the user's role, and if it says "customer" instead of "admin", the user gets redirected to the customer dashboard.

## Solution

### Step 1: Check Admin User Role

Run this script to see all users and their roles:

```bash
node scripts/fix-admin-role.mjs
```

This will show:
```
📧 admin@example.com
   Auth role: admin
   Profile role: customer  ← WRONG!
   ⚠️  Mismatch detected! Updating profile role to: admin
   ✅ Updated successfully
```

### Step 2: Manual Fix (If Script Doesn't Work)

Go to **Supabase Dashboard** → **Table Editor** → **profiles**

Find the admin user row and update the `role` column from `customer` to `admin`.

### Step 3: Clear Browser Cache

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Clear **Local Storage** and **Session Storage**
4. Close and reopen the browser
5. Log in again

### Step 4: Verify

1. Log in as admin
2. Go to `/admin`
3. You should now see the admin dashboard with stats cards

---

## Why This Happened

When the admin user was created, their profile might have been created with the wrong role. The auth system prioritizes the `profiles` table role over the auth metadata role.

**Auth Store Logic**:
```typescript
// Gets role from profiles table FIRST
const role = profile?.role || authData.user.user_metadata?.role || 'customer';
```

If `profile.role` is "customer", it will use that even if auth metadata says "admin".

---

## How to Prevent This

When creating an admin user:

1. **Via Signup**: Make sure to select "Admin" role during signup
2. **Via Supabase**: When creating auth user, set `user_metadata.role = 'admin'` AND create profile with `role = 'admin'`
3. **Via Script**: Use the fix script to verify all roles match

---

## Quick Verification

Check if admin role is correct:

```sql
-- Run in Supabase SQL Editor
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

Should return at least one row with the admin user.

---

## Files Involved

- `store/supabaseAuthStore.ts` — Auth logic (reads profile.role)
- `app/(admin)/admin/page.tsx` — Admin dashboard (checks user.role === 'admin')
- `scripts/fix-admin-role.mjs` — Fix script (updates profile roles)

---

## Status

✅ **Fix Script Ready**: `scripts/fix-admin-role.mjs`
✅ **Manual Fix Available**: Update profiles table directly
✅ **Verification Steps**: Clear cache and log in again

---

## Next Steps

1. Run `node scripts/fix-admin-role.mjs`
2. Clear browser cache
3. Log in again
4. Verify admin dashboard shows correctly

---

**Status**: FIXABLE ✅
