# Supabase Setup - Corrected (No Markdown Issues)

## ✅ Step-by-Step Setup

### Step 1: Create Storage Buckets (5 minutes)

1. Go to https://app.supabase.com
2. Select your project
3. Click **Storage** in the left menu
4. Click **Create a new bucket**

**Create Avatars Bucket:**
- Name: `avatars`
- Toggle **Public** to ON
- Click **Create bucket**

**Create Portfolio Bucket:**
- Name: `portfolio`
- Toggle **Public** to ON
- Click **Create bucket**

✅ Both buckets should now appear in your Storage list

---

### Step 2: Set Up RLS Policies (5 minutes)

1. In Supabase Dashboard, click **SQL Editor** in left menu
2. Click **New query**
3. Open the file `SUPABASE_RLS_POLICIES.sql` in your editor
4. Copy ALL the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click **Run**
7. Wait for success message (should say "Success" with no errors)

✅ All policies should now be created

---

### Step 3: Configure CORS (5 minutes)

1. In Supabase Dashboard, go to **Storage** → **Settings**
2. Scroll to **CORS Configuration**
3. Click **Add CORS configuration**
4. Paste this configuration:

[
  {
    "origin": ["http://localhost:3000", "https://yourdomain.com"],
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]

5. Click **Save**

✅ CORS is now configured

---

### Step 4: Test Everything (10 minutes)

**Test Avatar Upload:**
1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000/braider/dashboard
3. Click the avatar upload button
4. Select a test image (JPG or PNG)
5. Should upload successfully ✅

**Test Portfolio Upload:**
1. Go to http://localhost:3000/braider/portfolio
2. Click "Add Portfolio Item"
3. Upload test images
4. Should upload successfully ✅

**Test Service Creation:**
1. Go to http://localhost:3000/braider/services
2. Click "Add Service"
3. Fill in the form
4. Submit
5. Should save successfully ✅

---

## 🐛 Troubleshooting

### Error: "Bucket not found"
- Check bucket name is exactly `avatars` or `portfolio` (lowercase)
- Check bucket is set to Public (toggle should be ON)
- Refresh page and try again

### Error: "Permission denied"
- Check RLS policies were created successfully
- Check you're logged in with correct user
- Try running the SQL again

### Images not displaying
- Check bucket is Public
- Check file was uploaded (check in Supabase Storage)
- Clear browser cache (Ctrl+Shift+Delete)

### Upload hangs or fails
- Check file size is less than 5MB
- Check internet connection
- Open browser console (F12) and check for errors
- Try different browser

---

## ✅ Verification Checklist

- [ ] Avatars bucket created and Public
- [ ] Portfolio bucket created and Public
- [ ] RLS policies created (no SQL errors)
- [ ] CORS configured
- [ ] Avatar upload works
- [ ] Portfolio upload works
- [ ] Service creation works
- [ ] All pages load correctly

---

## 📁 Files You Need

- `SUPABASE_RLS_POLICIES.sql` - Copy/paste this into SQL Editor
- This file - Follow these steps

---

## 🎉 Done!

Once all tests pass, you're ready to:
1. Test on mobile devices
2. Run comprehensive testing
3. Deploy to production

**Total setup time: ~20 minutes**
