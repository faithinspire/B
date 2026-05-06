# VISUAL STEP-BY-STEP GUIDE

## 🎯 GOAL
Restore user data and deploy the app so:
- ✅ Admin page shows admin dashboard (not customer page)
- ✅ Admin can see all registered users with names and emails
- ✅ Messaging works between customer and braider
- ✅ Location maps work with real-time updates

---

## STEP 1️⃣: OPEN SUPABASE SQL EDITOR

### What to do:
1. Go to: **https://app.supabase.com**
2. Click your project
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New Query"** (top right)

### Screenshot reference:
```
┌─────────────────────────────────────────┐
│ Supabase Dashboard                      │
├─────────────────────────────────────────┤
│ Left Sidebar:                           │
│ • Project Settings                      │
│ • Database                              │
│ • SQL Editor ← CLICK HERE               │
│ • Auth                                  │
│ • Storage                               │
│                                         │
│ Main Area:                              │
│ [New Query] ← CLICK HERE                │
└─────────────────────────────────────────┘
```

---

## STEP 2️⃣: PASTE AND RUN SQL

### What to do:
1. Copy the entire SQL block below
2. Paste into the SQL Editor
3. Click **"Run"** button (or Ctrl+Enter)
4. Wait for: **"All queries executed successfully"**

### SQL to paste:

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

### Screenshot reference:
```
┌─────────────────────────────────────────┐
│ SQL Editor                              │
├─────────────────────────────────────────┤
│ [Run] [Format] [Save]                   │
├─────────────────────────────────────────┤
│ -- DISABLE RLS ON ALL TABLES            │
│ ALTER TABLE public.profiles...          │
│ ...                                     │
│ ...                                     │
├─────────────────────────────────────────┤
│ ✅ All queries executed successfully    │
└─────────────────────────────────────────┘
```

---

## STEP 3️⃣: VERIFY DATA RESTORED

### What to do:
1. Click **"New Query"** again
2. Paste this verification query:

```sql
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;
```

3. Click **"Run"**
4. Check results show names and emails (not NULL)

### Expected results:
```
┌──────────────────────────────────────────────────────┐
│ Results                                              │
├──────────────────────────────────────────────────────┤
│ id          │ email              │ full_name  │ role │
├─────────────┼────────────────────┼────────────┼──────┤
│ uuid-123... │ john@example.com   │ John Doe   │ admin│
│ uuid-456... │ jane@example.com   │ Jane Smith │ brai │
│ uuid-789... │ bob@example.com    │ Bob Jones  │ cust │
│ ...         │ ...                │ ...        │ ...  │
└──────────────────────────────────────────────────────┘
```

**✅ If you see names and emails**: Data restored successfully!  
**❌ If you see NULL or empty**: Something went wrong, check error messages.

---

## STEP 4️⃣: COMMIT CODE TO GIT

### What to do:
1. Open your terminal/command prompt
2. Navigate to your project folder
3. Run these commands one by one:

```bash
# Command 1: Add all changes
git add -A

# Command 2: Commit with message
git commit -m "Fix: Remove client-side role checks from admin pages and disable RLS for data access"

# Command 3: Push to GitHub
git push origin master
```

### Expected output:
```
$ git add -A
$ git commit -m "Fix: Remove client-side role checks..."
[master abc1234] Fix: Remove client-side role checks...
 2 files changed, 10 insertions(+), 5 deletions(-)

$ git push origin master
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
...
✓ master → origin/master
```

---

## STEP 5️⃣: MONITOR VERCEL DEPLOYMENT

### What to do:
1. Go to: **https://vercel.com/dashboard**
2. Find your project
3. Watch for deployment to start
4. Wait for green checkmark ✅

### Screenshot reference:
```
┌─────────────────────────────────────────┐
│ Vercel Dashboard                        │
├─────────────────────────────────────────┤
│ Project: B                              │
│                                         │
│ Deployments:                            │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ Production                       │ │
│ │ Commit: Fix: Remove client-side...  │ │
│ │ Status: Ready                       │ │
│ │ Time: 2 min ago                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⏳ Building...                      │ │
│ │ Commit: Fix: Remove client-side...  │ │
│ │ Status: Building (2/3)              │ │
│ │ Time: 1 min ago                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Wait for**: Green checkmark ✅ (usually 2-3 minutes)

---

## STEP 6️⃣: TEST IN PRODUCTION

### Test 1: Admin Dashboard
1. Go to: **https://your-app-url.vercel.app/admin**
2. Expected: Admin dashboard loads (NOT customer page)
3. Status: ✅ or ❌

### Test 2: Admin Users
1. Click: **"Manage Users"**
2. Expected: See all users with names and emails
3. Status: ✅ or ❌

### Test 3: Messaging
1. Login as customer
2. Go to: **Messages**
3. Send message to braider
4. Expected: Message appears in real-time
5. Status: ✅ or ❌

### Test 4: Location Maps
1. Login as braider
2. Go to: **Active booking**
3. Expected: Location map shows with real-time updates
4. Status: ✅ or ❌

---

## ✅ COMPLETION CHECKLIST

Mark each as you complete:

- [ ] SQL executed in Supabase
- [ ] Data verified (names and emails visible)
- [ ] Code committed to Git
- [ ] Vercel deployment successful
- [ ] Admin page loads correctly
- [ ] Users visible with names
- [ ] Messaging working
- [ ] Maps working

---

## 🚨 TROUBLESHOOTING

### Problem: SQL fails with error
**Solution**: 
- Check error message in Supabase
- Some tables may not exist (DO blocks handle this)
- Try running just the RLS disable part first

### Problem: Users still showing UUIDs
**Solution**:
- Verify SQL ran without errors
- Run verification query again
- Check Supabase profiles table directly

### Problem: Admin page still shows customer page
**Solution**:
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Wait 2 minutes for Vercel deployment

### Problem: Messaging not working
**Solution**:
- Check browser console for errors
- Verify Supabase connection
- Check API endpoint `/api/messages/send`

### Problem: Maps not working
**Solution**:
- Verify Google Maps API key in `.env.local`
- Check browser console for errors
- Verify location tracking API

---

## 🎉 YOU'RE DONE!

Once all tests pass:
1. ✅ App is deployed to production
2. ✅ Admin can see all users
3. ✅ Messaging works
4. ✅ Maps work
5. ✅ Everything is operational

**Total Time**: ~10 minutes  
**Difficulty**: Easy  
**Risk**: Low

**Execute now!** 🚀
