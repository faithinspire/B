# ⚡ ADMIN ROLE — QUICK FIX

## Problem
Admin seeing customer page instead of admin dashboard

## Solution (Pick One)

### 1️⃣ Automated (Easiest)
```bash
node scripts/fix-admin-role.mjs
```

### 2️⃣ Manual SQL
1. Supabase Dashboard → SQL Editor → New Query
2. Paste from `FIX_ADMIN_ROLE_SQL.sql`
3. Replace `admin@example.com` with your email
4. Run

### 3️⃣ Direct Edit
1. Supabase → Table Editor → profiles
2. Find admin user
3. Change `role` to `admin`
4. Save

## After Fix
1. Clear browser cache (F12 → Application → Clear)
2. Log out and log in
3. Go to `/admin`
4. Should see admin dashboard ✅

## Time
~2 minutes

---

**Status**: FIXABLE ✅
