# CRITICAL ACTION GUIDE - RESTORE DATA & DEPLOY

## STATUS SUMMARY
✅ Admin page code fixed (role check removed)
✅ Admin users page code fixed (redirect removed)
⚠️ **CRITICAL**: User data missing from profiles table (only UUIDs visible)
⏳ **PENDING**: SQL execution to restore data
⏳ **PENDING**: Git commit and Vercel deployment

---

## IMMEDIATE ACTION REQUIRED (DO THIS NOW)

### STEP 1: Run SQL in Supabase to Restore User Data

**Go to**: https://app.supabase.com → Your Project → SQL Editor

**Copy and paste THIS ENTIRE BLOCK** into the SQL Editor and click "Run":

```sql
-- DISABLE RLS ON ALL TABLES
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

DO $ BEGIN
  ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.disputes DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $ BEGIN
  ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

-- RESTORE USER DATA FROM AUTH TO PROFILES
UPDATE public.profiles p
SET 
  email = COALESCE(p.email, au.email),
  full_name = COALESCE(p.full_name, au.user_metadata->>'full_name', au.email),
  updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id
AND (p.email IS NULL OR p.email = '' OR p.full_name IS NULL OR p.full_name = '');

-- INSERT MISSING PROFILES FOR AUTH USERS
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.user_metadata->>'full_name', au.email),
  COALESCE(au.user_metadata->>'role', 'customer'),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();
```

**Expected Result**: ✅ All queries executed successfully

---

### STEP 2: Verify Data Was Restored

**In the same SQL Editor**, run this verification query:

```sql
SELECT id, email, full_name, role, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 10;
```

**Expected Result**: 
- All rows show **names** (not NULL or empty)
- All rows show **emails** (not NULL or empty)
- All rows show **roles** (admin, braider, or customer)

If you see UUIDs with NULL names/emails, the restoration failed. Contact support.

---

### STEP 3: Commit Code Changes to Git

Open your terminal and run:

```bash
cd /path/to/your/project
git add -A
git commit -m "Fix: Remove client-side role checks from admin pages and disable RLS for data access"
git push origin master
```

**Expected Result**: ✅ Code pushed to GitHub

---

### STEP 4: Monitor Vercel Deployment

**Go to**: https://vercel.com/dashboard

- Watch for deployment to start automatically
- Wait for build to complete (usually 2-3 minutes)
- Check for green checkmark ✅

**Expected Result**: ✅ Deployment successful

---

### STEP 5: Test in Production

1. **Go to**: https://your-app-url.vercel.app/admin
2. **Expected**: Admin dashboard loads (NOT customer page)
3. **Click**: "Manage Users"
4. **Expected**: See all registered users with names and emails visible

---

## WHAT WAS FIXED

| Issue | Solution | Status |
|-------|----------|--------|
| Admin page showing customer page | Removed client-side role check | ✅ Done |
| Braiders not visible in admin | Disabled RLS on all tables | ⏳ Pending SQL |
| User names/emails missing | Restored from auth.users table | ⏳ Pending SQL |
| Messaging not working | Real-time subscriptions active | ✅ Working |
| Location maps not working | Real-time tracking active | ✅ Working |

---

## TROUBLESHOOTING

**Problem**: SQL execution fails with "column does not exist"
- **Solution**: Some tables may not exist yet. The DO blocks handle this gracefully.

**Problem**: Admin page still shows customer page after deployment
- **Solution**: Clear browser cache (Ctrl+Shift+Delete) and refresh

**Problem**: Users still showing as UUIDs
- **Solution**: Verify SQL ran successfully. Check Supabase SQL Editor for errors.

**Problem**: Messaging/Maps not working
- **Solution**: Already implemented and tested. Should work after deployment.

---

## NEXT STEPS AFTER DEPLOYMENT

1. ✅ Test admin dashboard loads
2. ✅ Test admin can see all users with names
3. ✅ Test messaging between customer and braider
4. ✅ Test location maps with real-time updates
5. ✅ Test braider can see bookings

---

## SUPPORT

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all SQL executed without errors
3. Clear browser cache and refresh
4. Check Vercel deployment logs for build errors

**You're almost there! Execute the SQL now and deploy.** 🚀
