# RLS Policies Fixed ✅

## 🔴 What Went Wrong

You got this error:
```
ERROR: 42601: WITH CHECK cannot be applied to SELECT or DELETE
```

**Cause**: The SQL syntax was incorrect. `WITH CHECK` can only be used with INSERT and UPDATE operations. For SELECT and DELETE, you must use `USING` instead.

---

## ✅ What I Fixed

Changed the syntax:
- **INSERT & UPDATE**: Use `WITH CHECK`
- **SELECT & DELETE**: Use `USING`

---

## 🚀 What to Do Now

### Step 1: Delete Old Policies (Optional)

If you want to clean up, you can delete the failed policies:

Go to Supabase → SQL Editor → New query

Run this:
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

Click Run

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

After running the SQL:

**Test 1: Avatar Upload**
```
Go to: http://localhost:3000/braider/dashboard
Click: Avatar upload button
Select: Any image
Result: Should upload ✅
```

**Test 2: Portfolio Upload**
```
Go to: http://localhost:3000/braider/portfolio
Click: Add Portfolio Item
Select: Any images
Result: Should upload ✅
```

**Test 3: Service Creation**
```
Go to: http://localhost:3000/braider/services
Click: Add Service
Fill: Form
Result: Should save ✅
```

---

## 📝 What Changed

### Before (Wrong):
```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
WITH CHECK (  -- ❌ Wrong for DELETE
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### After (Correct):
```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (  -- ✅ Correct for DELETE
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 📚 Files Updated

- ✅ `SUPABASE_RLS_POLICIES.sql` - Fixed
- ✅ `RLS_POLICIES_COPY_PASTE.txt` - Fixed

---

## ✅ Checklist

- [ ] Delete old policies (optional)
- [ ] Run corrected SQL
- [ ] Test avatar upload
- [ ] Test portfolio upload
- [ ] Test service creation

---

## 🎉 You're Done!

Once all tests pass:
- ✅ All uploads working
- ✅ All pages responsive
- ✅ Ready for mobile testing
- ✅ Ready for production

**Total time: ~10 minutes**

---

**Status**: ✅ Fixed - Ready to Run  
**Files**: Updated and ready  
**Next**: Run the corrected SQL
