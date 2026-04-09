# VISUAL STEP-BY-STEP GUIDE - RESTORE USER DATA

## 📸 STEP 1: Open Supabase SQL Editor

```
1. Go to: https://app.supabase.com
2. Click your project
3. Left sidebar → SQL Editor
4. Click "New Query" button
```

**Screenshot location**: Top right of Supabase dashboard

---

## 📸 STEP 2: Paste the SQL

```
1. Click in the SQL editor text area
2. Paste the entire SQL block from RESTORE_DATA_NOW_CORRECTED.md
3. You should see the SQL code in the editor
```

**The SQL should look like**:
```
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_profiles DISABLE ROW LEVEL SECURITY;
...
```

---

## 📸 STEP 3: Click "Run"

```
1. Look for the "Run" button (usually blue, top right)
2. Click it
3. Wait for execution to complete
```

**Expected**: Green checkmark ✅ and message "All queries executed successfully"

---

## 📸 STEP 4: Verify Data

**In the same SQL Editor**, paste this verification query:

```sql
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 20;
```

**Click "Run" again**

**Expected Results**:
```
id                                  | email              | full_name          | role      | created_at
------------------------------------+--------------------+--------------------+-----------+------------------
550e8400-e29b-41d4-a716-446655440000| user@example.com   | user@example.com   | customer  | 2024-01-15
550e8400-e29b-41d4-a716-446655440001| braider@example.com| braider@example.com| braider   | 2024-01-16
550e8400-e29b-41d4-a716-446655440002| admin@example.com  | admin@example.com  | admin     | 2024-01-17
```

**Check**:
- ✅ Email column has values (not NULL)
- ✅ Full_name column has values (not NULL)
- ✅ Role column shows admin/braider/customer

---

## 📸 STEP 5: Commit to Git

**Open terminal and run**:

```bash
cd /path/to/your/project
git add -A
git commit -m "Fix: Remove client-side role checks and disable RLS for data access"
git push origin master
```

**Expected**: 
```
✓ master → origin/master
```

---

## 📸 STEP 6: Monitor Vercel

**Go to**: https://vercel.com/dashboard

**Watch for**:
1. Deployment starts automatically
2. Build progress shows
3. Green checkmark ✅ appears

**Time**: Usually 2-3 minutes

---

## 📸 STEP 7: Test in Production

**Go to**: https://your-app-url.vercel.app/admin

**Expected**: Admin dashboard loads (NOT customer page)

**Click**: "Manage Users"

**Expected**: See all users with names and emails visible

---

## 🎯 WHAT YOU'LL SEE AT EACH STEP

### After SQL Execution ✅
```
Query executed successfully
Rows affected: 45
```

### After Verification Query ✅
```
20 rows returned
All showing email and full_name
```

### After Git Push ✅
```
✓ master → origin/master
```

### After Vercel Deployment ✅
```
✓ Production deployment successful
```

### After Testing ✅
```
Admin page loads
Users visible with names
```

---

## ❌ IF SOMETHING GOES WRONG

### SQL Error: "column does not exist"
- **This is OK** - Some tables may not exist
- The DO blocks handle this
- Continue with the script

### SQL Error: "permission denied"
- **Check**: Are you in Supabase SQL Editor?
- **Not**: Direct database connection
- **Solution**: Use Supabase dashboard only

### Verification shows NULL values
- **Problem**: Data didn't restore
- **Solution**: Run SQL again
- **Check**: Error messages in SQL Editor

### Admin page still shows customer page
- **Problem**: Deployment not complete
- **Solution**: Wait 2-3 minutes for Vercel
- **Or**: Clear browser cache (Ctrl+Shift+Delete)

### Users still showing UUIDs
- **Problem**: Profiles table not updated
- **Solution**: Run verification query again
- **Check**: Did SQL execute without errors?

---

## 📊 PROGRESS TRACKER

```
[ ] Step 1: Open Supabase SQL Editor
[ ] Step 2: Paste SQL code
[ ] Step 3: Click Run
[ ] Step 4: Verify data restored
[ ] Step 5: Commit to Git
[ ] Step 6: Monitor Vercel deployment
[ ] Step 7: Test in production
[ ] ✅ COMPLETE!
```

---

## ⏱️ TIME ESTIMATE

| Step | Time |
|------|------|
| 1-3: SQL Execution | 2 min |
| 4: Verification | 1 min |
| 5: Git Commit | 1 min |
| 6: Vercel Deploy | 3 min |
| 7: Testing | 2 min |
| **TOTAL** | **~10 min** |

---

## 🚀 YOU'RE READY!

Everything is prepared. Just follow the steps above and your app will be fully restored and deployed.

**Start with Step 1 now!** 🎯
