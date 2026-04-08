# ✅ ADMIN ROLE FIX — COMPLETE SOLUTION

## Problem Summary

Admin user is seeing the customer dashboard instead of the admin dashboard at `/admin`.

## Root Cause

The admin user's profile in the database has `role = 'customer'` instead of `role = 'admin'`.

The auth system checks the `profiles` table first:
```typescript
const role = profile?.role || authData.user.user_metadata?.role || 'customer';
```

If the profile says "customer", that's what gets used, even if auth metadata says "admin".

---

## 🚀 Quick Fix (Choose One)

### Option 1: Automated Script (Recommended)

```bash
node scripts/fix-admin-role.mjs
```

This will:
- ✅ List all users and their roles
- ✅ Detect mismatches
- ✅ Automatically fix them
- ✅ Show verification

### Option 2: Manual SQL Fix

1. Go to **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Copy and paste from `FIX_ADMIN_ROLE_SQL.sql`
3. Replace `admin@example.com` with your admin email
4. Run the query

### Option 3: Direct Database Edit

1. Go to **Supabase Dashboard** → **Table Editor**
2. Click **profiles** table
3. Find the admin user row
4. Change `role` column from `customer` to `admin`
5. Click Save

---

## ✅ Verification Steps

### After Running Fix:

1. **Clear Browser Cache**
   - Press F12 (DevTools)
   - Go to **Application** tab
   - Click **Clear Site Data**
   - Close browser

2. **Log In Again**
   - Go to `/login`
   - Enter admin credentials
   - Click Sign In

3. **Check Admin Dashboard**
   - Go to `/admin`
   - Should see admin dashboard with:
     - Stats cards (Total Users, Bookings, Revenue, etc.)
     - Quick navigation buttons
     - NOT the customer dashboard

4. **Verify in Database**
   - Supabase Dashboard → Table Editor → profiles
   - Find admin user
   - Confirm `role = 'admin'`

---

## 📋 What Each Fix Does

### Script (`fix-admin-role.mjs`)
- Connects to Supabase using service role key
- Lists all users from auth
- Checks each user's profile
- Detects role mismatches
- Automatically updates profiles
- Shows results

### SQL (`FIX_ADMIN_ROLE_SQL.sql`)
- Manual SQL queries
- Check current roles
- Update specific user
- Verify changes
- Bulk fix option

### Direct Edit
- Manual UI-based fix
- No code needed
- Slowest but most visual

---

## 🔍 How to Check If Admin Role Is Correct

### In Supabase Dashboard:

1. Go to **Table Editor**
2. Click **profiles** table
3. Look for your admin user
4. Check the `role` column
5. Should say `admin` (not `customer`)

### In SQL:

```sql
SELECT email, role FROM profiles WHERE email = 'your-admin@email.com';
```

Should return:
```
email                  | role
your-admin@email.com   | admin
```

---

## 🛠️ Files Created

- `scripts/fix-admin-role.mjs` — Automated fix script
- `FIX_ADMIN_ROLE_SQL.sql` — Manual SQL fix
- `ADMIN_PAGE_FIX_NOW.md` — Detailed explanation
- `ADMIN_ROLE_FIX_COMPLETE.md` — This file

---

## 📊 How Auth Works

```
User logs in
    ↓
Auth system checks session
    ↓
Fetches profile from database
    ↓
Gets role from profile.role
    ↓
Sets user.role in auth store
    ↓
Admin page checks: if (user.role === 'admin')
    ↓
If true: Show admin dashboard
If false: Redirect to customer dashboard
```

**Key Point**: The profile role is checked FIRST, so it must be correct.

---

## ⚠️ Common Issues

### Issue: Still Seeing Customer Page After Fix

**Solution**:
1. Clear browser cache completely
2. Close all browser tabs
3. Reopen browser
4. Log in again
5. Try `/admin` again

### Issue: Can't Find Admin User in Database

**Solution**:
1. Go to Supabase → Authentication → Users
2. Find your admin email
3. Copy the user ID
4. Go to Table Editor → profiles
5. Search for that user ID
6. Update the role

### Issue: Script Says "Missing Credentials"

**Solution**:
1. Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
2. Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
3. Restart terminal
4. Try script again

---

## ✨ Summary

**Problem**: Admin role is wrong in database
**Solution**: Update profile role to 'admin'
**Time**: ~2 minutes
**Verification**: Clear cache, log in, check `/admin`

---

## 🎯 Next Steps

1. **Run Fix**:
   ```bash
   node scripts/fix-admin-role.mjs
   ```

2. **Clear Cache**:
   - F12 → Application → Clear Site Data

3. **Log In Again**:
   - Go to `/login`
   - Enter admin credentials

4. **Verify**:
   - Go to `/admin`
   - Should see admin dashboard

5. **Done** ✅

---

**Status**: FIXABLE ✅
**Time to Fix**: ~2 minutes ⏱️
**Difficulty**: Easy 🟢
