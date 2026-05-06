# ✅ Exact Steps Checklist

## 🎯 Follow These Steps Exactly

### Step 1: Create "avatars" Bucket

- [ ] Open Supabase Dashboard
- [ ] Click **Storage** (left sidebar)
- [ ] Click **Create bucket** button
- [ ] Type name: `avatars`
- [ ] Toggle **Public** ON (blue)
- [ ] Click **Create** button
- [ ] Verify: "avatars" appears in bucket list

### Step 2: Create "portfolio" Bucket

- [ ] Click **Create bucket** button again
- [ ] Type name: `portfolio`
- [ ] Toggle **Public** ON (blue)
- [ ] Click **Create** button
- [ ] Verify: "portfolio" appears in bucket list

### Step 3: Disable RLS on "avatars"

- [ ] Click **avatars** bucket
- [ ] Click **Settings** (gear icon, top right)
- [ ] Find **RLS** toggle
- [ ] Toggle **OFF** (gray)
- [ ] Click **Save** button
- [ ] Verify: RLS shows "Disabled"

### Step 4: Disable RLS on "portfolio"

- [ ] Click **portfolio** bucket
- [ ] Click **Settings** (gear icon, top right)
- [ ] Find **RLS** toggle
- [ ] Toggle **OFF** (gray)
- [ ] Click **Save** button
- [ ] Verify: RLS shows "Disabled"

### Step 5: Restart Dev Server

- [ ] Open terminal
- [ ] Press **Ctrl+C** (stop current server)
- [ ] Wait for server to stop
- [ ] Type: `npm run dev`
- [ ] Press **Enter**
- [ ] Wait for "ready - started server on 0.0.0.0:3000"

---

## 🧪 Test Avatar Upload

- [ ] Open browser
- [ ] Go to: `http://localhost:3000/braider/dashboard`
- [ ] Click upload icon on profile photo
- [ ] Select any image file
- [ ] Wait for upload
- [ ] Verify: Image displays, no error message

---

## 🧪 Test Portfolio Upload

- [ ] Go to: `http://localhost:3000/braider/portfolio`
- [ ] Click **Add Portfolio Item** button
- [ ] Click upload area
- [ ] Select image file
- [ ] Wait for upload
- [ ] Fill in form:
  - [ ] Title: "Test Portfolio"
  - [ ] Style: "Box Braids"
  - [ ] Description: "Test"
- [ ] Click **Add Item** button
- [ ] Verify: Portfolio item appears, no error message

---

## 🧪 Test Service Creation

- [ ] Go to: `http://localhost:3000/braider/services`
- [ ] Click **Add Service** button
- [ ] Fill in form:
  - [ ] Name: "Test Service"
  - [ ] Price: "50"
  - [ ] Duration: "60"
  - [ ] Description: "Test"
- [ ] Click **Add Service** button
- [ ] Verify: Service appears, no error message

---

## ✅ Final Verification

- [ ] All 3 tests passed
- [ ] No error messages in browser
- [ ] No error messages in console (F12)
- [ ] Files appear in Supabase Storage
- [ ] Ready for production

---

## 🎉 Success!

If all checkboxes are checked, you're done!

All uploads are working. No more errors.

