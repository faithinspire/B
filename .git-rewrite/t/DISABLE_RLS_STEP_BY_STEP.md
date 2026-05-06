# Disable RLS - Step by Step Visual Guide

## 🎯 Your Task

Disable RLS on 2 buckets using the Supabase Dashboard.

---

## 📍 Step 1: Go to Supabase Dashboard

```
URL: https://app.supabase.com
```

---

## 📍 Step 2: Navigate to Storage

```
Left Menu → Storage
```

You should see:
```
📦 avatars
📦 portfolio
```

---

## 📍 Step 3: Disable RLS for Avatars

### 3.1: Click Avatars Bucket
```
Click on: avatars
```

### 3.2: Open Settings
```
Look for: Settings icon (gear ⚙️)
Click on: Settings
```

### 3.3: Find RLS Toggle
```
Look for: "RLS" or "Row Level Security"
Current state: Should be ON (enabled)
```

### 3.4: Disable RLS
```
Click: Toggle to turn OFF
Status: Should now show "Disabled"
```

### 3.5: Save
```
Click: Save button
Wait for: Success message
```

---

## 📍 Step 4: Disable RLS for Portfolio

### 4.1: Go Back to Storage
```
Click: Storage in left menu
```

### 4.2: Click Portfolio Bucket
```
Click on: portfolio
```

### 4.3: Open Settings
```
Click: Settings icon (gear ⚙️)
```

### 4.4: Disable RLS
```
Find: RLS toggle
Click: Toggle to turn OFF
Status: Should now show "Disabled"
```

### 4.5: Save
```
Click: Save button
Wait for: Success message
```

---

## 🧪 Step 5: Test Uploads

### Test 1: Avatar Upload
```
URL: http://localhost:3000/braider/dashboard
Action: Click avatar upload button
Select: Any JPG or PNG image
Expected: ✅ Upload succeeds
```

### Test 2: Portfolio Upload
```
URL: http://localhost:3000/braider/portfolio
Action: Click "Add Portfolio Item"
Select: Any images
Expected: ✅ Upload succeeds
```

### Test 3: Service Creation
```
URL: http://localhost:3000/braider/services
Action: Click "Add Service"
Fill: Service name, price, duration
Expected: ✅ Service saves
```

---

## ✅ Verification

### Check Avatars Bucket
```
Storage → avatars → Settings
RLS should show: Disabled ✅
```

### Check Portfolio Bucket
```
Storage → portfolio → Settings
RLS should show: Disabled ✅
```

### Check Uploads Work
```
Avatar upload: ✅ Works
Portfolio upload: ✅ Works
Service creation: ✅ Works
```

---

## 🎉 You're Done!

All uploads should now work perfectly.

**Total time: ~5 minutes**
