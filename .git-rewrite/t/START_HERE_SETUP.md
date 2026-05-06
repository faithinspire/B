# START HERE - Supabase Setup (Fixed)

## 🎯 Your Task

Set up Supabase storage buckets and RLS policies so uploads work.

**Time**: ~25 minutes  
**Difficulty**: Easy  
**Status**: ✅ All code ready, just need Supabase config

---

## 🚀 Quick Start (3 Steps)

### Step 1: Create 2 Buckets (5 min)

Go to https://app.supabase.com → Storage → Create a new bucket

**Bucket 1:**
- Name: `avatars`
- Public: ON
- Create

**Bucket 2:**
- Name: `portfolio`
- Public: ON
- Create

✅ Done

---

### Step 2: Run SQL Policies (5 min)

1. Open file: **`RLS_POLICIES_COPY_PASTE.txt`** ← This file
2. Copy ALL the code (Ctrl+A, Ctrl+C)
3. Go to Supabase → SQL Editor → New query
4. Paste the code (Ctrl+V)
5. Click **Run**
6. Wait for success message

✅ Done

---

### Step 3: Configure CORS (5 min)

Go to Supabase → Storage → Settings → CORS Configuration

Add this:
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

Click Save

✅ Done

---

## ✅ Test It (10 min)

### Test 1: Avatar Upload
```
Go to: http://localhost:3000/braider/dashboard
Click: Avatar upload button
Select: Any image
Result: Should upload ✅
```

### Test 2: Portfolio Upload
```
Go to: http://localhost:3000/braider/portfolio
Click: Add Portfolio Item
Select: Any images
Result: Should upload ✅
```

### Test 3: Service Creation
```
Go to: http://localhost:3000/braider/services
Click: Add Service
Fill: Form
Result: Should save ✅
```

---

## 🐛 If Something Goes Wrong

### Error: "syntax error at or near ```"
```
❌ You copied markdown code with backticks
✅ Use RLS_POLICIES_COPY_PASTE.txt instead
```

### Error: "Bucket not found"
```
✅ Check bucket name is exactly 'avatars' or 'portfolio'
✅ Check bucket is set to Public
✅ Refresh page
```

### Error: "Permission denied"
```
✅ Check RLS policies were created
✅ Check you're logged in
✅ Try running SQL again
```

### Images not displaying
```
✅ Check bucket is Public
✅ Check file was uploaded
✅ Clear browser cache (Ctrl+Shift+Delete)
```

---

## 📚 Need More Help?

**Visual Guide**: `SUPABASE_SETUP_VISUAL_GUIDE.md`  
**Detailed Guide**: `SUPABASE_SETUP_CORRECTED.md`  
**Complete Reference**: `SETUP_COMPLETE_GUIDE.md`  
**What Went Wrong**: `SETUP_ERROR_RESOLVED.md`

---

## ✅ Checklist

- [ ] Avatars bucket created
- [ ] Portfolio bucket created
- [ ] SQL policies created
- [ ] CORS configured
- [ ] Avatar upload works
- [ ] Portfolio upload works
- [ ] Service creation works

---

## 🎉 You're Done!

Once all tests pass, you have:
- ✅ All uploads working
- ✅ All pages responsive
- ✅ Ready for mobile testing
- ✅ Ready for production

**Next**: Run comprehensive testing on all devices.

---

**Total Time**: ~25 minutes  
**Status**: ✅ Ready to Setup  
**All Code**: ✅ Already fixed
