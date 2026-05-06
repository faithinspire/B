# Final RLS Fix - 1 Minute

## 🔴 Error You Got
```
ERROR: 42710: policy "Public can read avatars" for table "objects" already exists
```

## ✅ Fix

The policies already exist from previous attempts. I've updated the SQL to drop all old policies first, then create the new ones.

---

## 🚀 What to Do (1 Step)

### Run Complete SQL

1. Open `RLS_POLICIES_COPY_PASTE.txt`
2. Copy ALL the code
3. Go to Supabase SQL Editor → New query
4. Paste the code
5. Click **Run**
6. Should succeed ✅

That's it! The SQL now includes DROP statements to clean up old policies first.

---

## 🧪 Test Uploads

After running the SQL:

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

## 🎉 Done!

All uploads should now work.

**Total time: ~1 minute**
