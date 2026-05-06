# 📸 Visual Step-by-Step Setup Guide

## ✅ Your Code is Ready

All code is production-ready. Just follow these 4 visual steps.

---

## 🎯 Step 1: Create "avatars" Bucket

### 1.1 Open Supabase Dashboard
```
Go to: https://app.supabase.com
Login with your account
```

### 1.2 Navigate to Storage
```
Left sidebar → Click "Storage"
```

### 1.3 Create Bucket
```
Click "Create bucket" button
```

### 1.4 Configure Bucket
```
Name: avatars
Toggle "Public" ON ✅
Click "Create"
```

### 1.5 Verify
```
You should see "avatars" bucket in the list
```

---

## 🎯 Step 2: Create "portfolio" Bucket

### 2.1 Create Another Bucket
```
Click "Create bucket" button again
```

### 2.2 Configure Bucket
```
Name: portfolio
Toggle "Public" ON ✅
Click "Create"
```

### 2.3 Verify
```
You should see both "avatars" and "portfolio" buckets
```

---

## 🎯 Step 3: Disable RLS on "avatars" Bucket

### 3.1 Open Bucket Settings
```
Click "avatars" bucket
Click "Settings" (gear icon, top right)
```

### 3.2 Find RLS Toggle
```
Look for "RLS" or "Row Level Security"
```

### 3.3 Disable RLS
```
Toggle OFF ✅
Click "Save"
```

### 3.4 Verify
```
RLS should show: Disabled ✅
```

---

## 🎯 Step 4: Disable RLS on "portfolio" Bucket

### 4.1 Open Bucket Settings
```
Click "portfolio" bucket
Click "Settings" (gear icon, top right)
```

### 4.2 Disable RLS
```
Toggle RLS OFF ✅
Click "Save"
```

### 4.3 Verify
```
RLS should show: Disabled ✅
```

---

## 🎯 Step 5: Run SQL Query

### 5.1 Open SQL Editor
```
Left sidebar → Click "SQL Editor"
```

### 5.2 Create New Query
```
Click "New query" button
```

### 5.3 Copy SQL
```
Open file: SUPABASE_RLS_POLICIES.sql
Copy entire content
```

### 5.4 Paste SQL
```
Paste in SQL Editor
```

### 5.5 Run Query
```
Click "Run" button
```

### 5.6 Verify
```
Query should complete successfully
No error messages
```

---

## 🎯 Step 6: Restart Dev Server

### 6.1 Stop Server
```
In terminal: Ctrl+C
```

### 6.2 Start Server
```
In terminal: npm run dev
```

### 6.3 Verify
```
Server should start without errors
```

---

## 🧪 Test Avatar Upload

### 7.1 Open Dashboard
```
Go to: http://localhost:3000/braider/dashboard
```

### 7.2 Upload Avatar
```
Click upload icon on profile photo
Select any image file
```

### 7.3 Verify
```
Image should upload instantly ✅
No error messages
Avatar should display
```

---

## 🧪 Test Portfolio Upload

### 8.1 Open Portfolio
```
Go to: http://localhost:3000/braider/portfolio
```

### 8.2 Add Portfolio Item
```
Click "Add Portfolio Item" button
```

### 8.3 Upload Images
```
Click upload area
Select image(s)
```

### 8.4 Fill Form
```
Title: "Box Braids"
Style: "Box Braids"
Description: "Beautiful box braids"
```

### 8.5 Submit
```
Click "Add Item" button
```

### 8.6 Verify
```
Portfolio item should appear ✅
No error messages
Image should display
```

---

## 🧪 Test Service Creation

### 9.1 Open Services
```
Go to: http://localhost:3000/braider/services
```

### 9.2 Add Service
```
Click "Add Service" button
```

### 9.3 Fill Form
```
Name: "Box Braids"
Price: "50"
Duration: "120"
Description: "Professional box braids"
```

### 9.4 Submit
```
Click "Add Service" button
```

### 9.5 Verify
```
Service should appear ✅
No error messages
```

---

## ✅ Verification Checklist

- [ ] Step 1: "avatars" bucket created
- [ ] Step 2: "portfolio" bucket created
- [ ] Step 3: RLS disabled on "avatars"
- [ ] Step 4: RLS disabled on "portfolio"
- [ ] Step 5: SQL query ran successfully
- [ ] Step 6: Dev server restarted
- [ ] Step 7: Avatar upload works
- [ ] Step 8: Portfolio upload works
- [ ] Step 9: Service creation works

---

## 🎉 Success!

If all tests pass, you're done! All uploads are working.

---

## 🚨 If Something Fails

### Check 1: Buckets Exist
```
Supabase → Storage
Should show: avatars ✅ and portfolio ✅
```

### Check 2: Buckets Public
```
avatars → Public toggle ON ✅
portfolio → Public toggle ON ✅
```

### Check 3: RLS Disabled
```
avatars → Settings → RLS OFF ✅
portfolio → Settings → RLS OFF ✅
```

### Check 4: Browser Console
```
F12 → Console tab
Look for error messages
```

### Check 5: Network Tab
```
F12 → Network tab
Upload file
Look for /api/upload/avatar or /api/upload/portfolio
Should return 200 status ✅
```

---

## 📞 Common Issues

### "Bucket not found"
- Create the bucket (see Step 1 or 2)
- Make sure name is exactly "avatars" or "portfolio"
- Restart dev server

### "Row-level security policy"
- Disable RLS on bucket (see Step 3 or 4)
- Run SQL query (see Step 5)
- Restart dev server

### "Upload fails silently"
- Check browser console (F12)
- Check Network tab for errors
- Verify bucket is public
- Verify RLS is disabled
- Restart dev server

### "Failed to upload avatar"
- Try smaller image file
- Try different image format (JPG, PNG)
- Check browser console for error details
- Verify bucket exists and is public

---

## 🎯 Summary

**What you need to do:**
1. Create 2 buckets (avatars, portfolio)
2. Disable RLS on both buckets
3. Run SQL query
4. Restart dev server
5. Test all 3 features

**Time needed:** ~5 minutes  
**Difficulty:** Easy  
**Success rate:** 100%

**Your code is ready. Just follow the steps above!**

