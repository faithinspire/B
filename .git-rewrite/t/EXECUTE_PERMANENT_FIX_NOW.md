# Execute Permanent Fix Now - 5 Minutes

## 🎯 Your Task

Complete 5 simple steps to fix all uploads permanently.

---

## ✅ Step 1: Get Service Role Key (1 min)

1. Go to https://app.supabase.com
2. Click your project
3. **Settings** → **API**
4. Copy **Service Role** key

---

## ✅ Step 2: Add to .env.local (1 min)

Open `.env.local` and add:

```
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

---

## ✅ Step 3: Create Buckets (1 min)

1. Supabase → **Storage**
2. Create: `avatars` (Public)
3. Create: `portfolio` (Public)

---

## ✅ Step 4: Run RLS Policies (1 min)

1. Supabase → **SQL Editor** → **New query**
2. Open: `SUPABASE_RLS_POLICIES.sql`
3. Copy ALL content
4. Paste in SQL Editor
5. Click **Run**

---

## ✅ Step 5: Restart Dev Server (1 min)

```
Stop: Ctrl+C
Start: npm run dev
```

---

## 🧪 Test All Three

**Avatar:**
```
http://localhost:3000/braider/dashboard
Click upload → Select image → Should work ✅
```

**Portfolio:**
```
http://localhost:3000/braider/portfolio
Click Add Portfolio Item → Upload images → Should work ✅
```

**Service:**
```
http://localhost:3000/braider/services
Click Add Service → Fill form → Should work ✅
```

---

## 🎉 Done!

All uploads now work permanently.

**Total time: ~5 minutes**
