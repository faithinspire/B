# Supabase Setup - Visual Guide

## 🎯 What You Need to Do

```
1. Create 2 Buckets
   ├─ avatars (Public)
   └─ portfolio (Public)

2. Run SQL Policies
   ├─ Copy from RLS_POLICIES_COPY_PASTE.txt
   └─ Paste into SQL Editor → Run

3. Configure CORS
   └─ Add localhost:3000 and your domain

4. Test Uploads
   ├─ Avatar upload
   ├─ Portfolio upload
   └─ Service creation
```

---

## 📍 Step 1: Create Buckets

### Location in Supabase:
```
Dashboard → Storage → Create a new bucket
```

### Create First Bucket:
```
Name: avatars
Public: ON (toggle to the right)
Click: Create bucket
```

### Create Second Bucket:
```
Name: portfolio
Public: ON (toggle to the right)
Click: Create bucket
```

### Result:
You should see both buckets listed:
```
📦 avatars (Public)
📦 portfolio (Public)
```

---

## 📍 Step 2: Run SQL Policies

### Location in Supabase:
```
Dashboard → SQL Editor → New query
```

### What to Do:
1. Open file: `RLS_POLICIES_COPY_PASTE.txt`
2. Select ALL text (Ctrl+A)
3. Copy (Ctrl+C)
4. Go to Supabase SQL Editor
5. Paste (Ctrl+V)
6. Click **Run** button

### Expected Result:
```
✅ Success
8 policies created
```

### If You Get Error:
```
❌ ERROR: 42601: syntax error at or near "```"
```
This means you copied markdown code fences. Use `RLS_POLICIES_COPY_PASTE.txt` instead.

---

## 📍 Step 3: Configure CORS

### Location in Supabase:
```
Dashboard → Storage → Settings → CORS Configuration
```

### What to Add:
```
[
  {
    "origin": ["http://localhost:3000", "https://yourdomain.com"],
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

### Click: Save

---

## 📍 Step 4: Test Uploads

### Test 1: Avatar Upload
```
URL: http://localhost:3000/braider/dashboard
Action: Click avatar upload button
Select: Any JPG or PNG image
Expected: ✅ Upload succeeds, avatar displays
```

### Test 2: Portfolio Upload
```
URL: http://localhost:3000/braider/portfolio
Action: Click "Add Portfolio Item"
Select: Any JPG or PNG images
Expected: ✅ Upload succeeds, images display
```

### Test 3: Service Creation
```
URL: http://localhost:3000/braider/services
Action: Click "Add Service"
Fill: Service name, price, duration
Expected: ✅ Service saves successfully
```

---

## 🔍 Verification

### Check Buckets Created:
```
Dashboard → Storage
Should see:
  ✅ avatars (Public)
  ✅ portfolio (Public)
```

### Check Policies Created:
```
Dashboard → SQL Editor → New query
Run: SELECT * FROM pg_policies WHERE schemaname = 'storage';
Should see: 8 policies listed
```

### Check CORS Configured:
```
Dashboard → Storage → Settings
Should see: CORS configuration saved
```

### Check Uploads Work:
```
Dashboard → Storage → avatars
Should see: User folders with avatar images

Dashboard → Storage → portfolio
Should see: User folders with portfolio images
```

---

## 🚨 Common Issues

### Issue 1: "Bucket not found"
```
Check:
  ✅ Bucket name is exactly 'avatars' or 'portfolio'
  ✅ Bucket is set to Public
  ✅ Refresh page
```

### Issue 2: "Permission denied"
```
Check:
  ✅ RLS policies were created
  ✅ You're logged in
  ✅ User ID matches folder name
```

### Issue 3: SQL Error with "```"
```
Solution:
  ✅ Use RLS_POLICIES_COPY_PASTE.txt (not markdown files)
  ✅ Copy only the SQL code
  ✅ Don't include backticks
```

### Issue 4: Images not displaying
```
Check:
  ✅ Bucket is Public
  ✅ File was uploaded
  ✅ Clear browser cache
```

---

## ✅ Success Checklist

- [ ] Avatars bucket created and Public
- [ ] Portfolio bucket created and Public
- [ ] SQL policies created (8 total)
- [ ] CORS configured
- [ ] Avatar upload works
- [ ] Portfolio upload works
- [ ] Service creation works
- [ ] All pages load correctly

---

## 📊 Timeline

```
Step 1 (Create Buckets):     5 minutes
Step 2 (Run SQL):            5 minutes
Step 3 (Configure CORS):     5 minutes
Step 4 (Test Uploads):       10 minutes
─────────────────────────────────────
Total:                       25 minutes
```

---

## 🎉 You're Done!

Once all tests pass:
1. ✅ All uploads working
2. ✅ All pages responsive
3. ✅ Ready for mobile testing
4. ✅ Ready for production

**Next: Run comprehensive testing on all devices**
