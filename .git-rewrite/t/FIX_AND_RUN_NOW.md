# Fix and Run Now - 2 Minutes

## 🔴 Error You Got
```
ERROR: 42601: WITH CHECK cannot be applied to SELECT or DELETE
```

## ✅ Fix

The SQL syntax was wrong. I've corrected it.

---

## 🚀 What to Do (2 Steps)

### Step 1: Delete Old Policies (1 min)

Go to Supabase → SQL Editor → New query

Copy and paste this:

```
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Braiders can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Braiders can update their portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Braiders can delete their portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read portfolio images" ON storage.objects;
```

Click **Run**

### Step 2: Run Corrected SQL (1 min)

1. Open `RLS_POLICIES_COPY_PASTE.txt`
2. Copy ALL the code
3. Go to Supabase SQL Editor → New query
4. Paste the code
5. Click **Run**
6. Should succeed ✅

---

## ✅ Test It

**Avatar Upload:**
```
http://localhost:3000/braider/dashboard
Click avatar upload → Select image → Should work ✅
```

**Portfolio Upload:**
```
http://localhost:3000/braider/portfolio
Click Add Portfolio Item → Upload images → Should work ✅
```

**Service Creation:**
```
http://localhost:3000/braider/services
Click Add Service → Fill form → Should work ✅
```

---

## 🎉 Done!

All uploads should now work.

**Total time: ~2 minutes**
