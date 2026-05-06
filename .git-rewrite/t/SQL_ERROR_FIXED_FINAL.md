# SQL Error Fixed - Final Solution ✅

## 🔴 Problem

You got this error when running the SQL:
```
ERROR: 42601: WITH CHECK cannot be applied to SELECT or DELETE
```

## 🔍 Root Cause

The RLS policy syntax was incorrect. PostgreSQL doesn't allow `WITH CHECK` for SELECT and DELETE operations:
- ✅ `WITH CHECK` - Only for INSERT and UPDATE
- ✅ `USING` - For SELECT, UPDATE, and DELETE

The old SQL used `WITH CHECK` for DELETE and SELECT, which is invalid.

## ✅ Solution

I've corrected all the SQL policies:

**Changed:**
- DELETE policies: `WITH CHECK` → `USING`
- SELECT policies: `WITH CHECK` → `USING`
- INSERT & UPDATE: Keep `WITH CHECK` (correct)

---

## 📁 Files Updated

- ✅ `SUPABASE_RLS_POLICIES.sql` - Corrected
- ✅ `RLS_POLICIES_COPY_PASTE.txt` - Corrected

---

## 🚀 Quick Fix (2 Minutes)

### Step 1: Delete Old Policies

Go to Supabase → SQL Editor → New query

Paste this:
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

### Step 2: Run Corrected SQL

1. Open `RLS_POLICIES_COPY_PASTE.txt`
2. Copy ALL the code
3. Go to Supabase SQL Editor → New query
4. Paste the code
5. Click **Run**
6. Should succeed ✅

---

## ✅ Expected Result

```
✅ Success
✅ 8 policies created
✅ No errors
```

---

## 🧪 Test Uploads

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

## 📝 What Changed

### Before (Wrong):
```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
WITH CHECK (  -- ❌ Invalid for DELETE
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');  -- ✅ This was correct
```

### After (Correct):
```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (  -- ✅ Correct for DELETE
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');  -- ✅ Still correct
```

---

## 📚 Reference

**Quick Fix**: `FIX_AND_RUN_NOW.md`  
**Detailed**: `RLS_POLICIES_FIXED.md`  
**SQL Files**: `RLS_POLICIES_COPY_PASTE.txt` or `SUPABASE_RLS_POLICIES.sql`

---

## ✅ Checklist

- [ ] Delete old policies
- [ ] Run corrected SQL
- [ ] Test avatar upload
- [ ] Test portfolio upload
- [ ] Test service creation

---

## 🎉 Summary

**Problem**: Invalid RLS policy syntax  
**Solution**: Changed `WITH CHECK` to `USING` for DELETE/SELECT  
**Status**: ✅ Fixed and ready  
**Time to Fix**: ~2 minutes  
**Files**: Updated and ready

**Next**: Run the corrected SQL and test uploads.

---

**Created**: March 13, 2026  
**Status**: ✅ Complete  
**Ready**: Yes
