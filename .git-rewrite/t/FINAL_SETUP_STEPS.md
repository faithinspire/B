# Final Setup Steps - 2 Minutes

## 🎯 Your Task

Add the service role key to your environment and restart the server.

---

## 🚀 Step 1: Get Service Role Key

1. Go to https://app.supabase.com
2. Click your project
3. Go to **Settings** → **API**
4. Find **Service Role** (NOT anon key)
5. Copy the key

---

## 🚀 Step 2: Add to .env.local

Open `.env.local` and add:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Replace `your_service_role_key_here` with the actual key you copied.

---

## 🚀 Step 3: Restart Dev Server

```
Stop: Ctrl+C (in terminal)
Start: npm run dev
```

Wait for "ready - started server on 0.0.0.0:3000"

---

## 🧪 Step 4: Test Uploads

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

## ✅ Expected Result

```
✅ All uploads working
✅ No more RLS errors
✅ Files publicly accessible
```

---

## 🎉 Done!

All uploads should now work perfectly.

**Total time: ~2 minutes**
