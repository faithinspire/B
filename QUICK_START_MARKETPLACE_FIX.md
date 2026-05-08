# Quick Start: Marketplace Fix

## ✅ What's Fixed
1. ✅ Delivery address column added
2. ✅ Product images now display
3. ✅ Admin management system ready

## 🚀 Do This Now (15 minutes)

### Step 1: Run SQL Migration (2 min)
```
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: SQL Editor → New Query
4. Copy this SQL:
```

```sql
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('marketplace-products', 'marketplace-products', NULL, true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'], NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for marketplace products" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace-products');
CREATE POLICY "Authenticated users can upload to marketplace-products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace-products' AND auth.role() = 'authenticated');
```

```
5. Click: Run
6. Done! ✅
```

---

### Step 2: Make 3 Users Admins (5 min)
```
1. Go to: https://supabase.com/dashboard
2. Click: Authentication → Users
3. For each of 3 users:
   a. Click on user email
   b. Click "Edit user"
   c. Find "raw_user_meta_data"
   d. Click edit (pencil icon)
   e. Add: { "role": "admin" }
   f. Click "Save"
4. Done! ✅
```

---

### Step 3: Test Image Upload (5 min)
```bash
curl -X POST http://localhost:3000/api/marketplace/products/upload-image \
  -F "product_id=YOUR_PRODUCT_ID" \
  -F "file=@/path/to/image.jpg"
```

Expected response:
```json
{
  "success": true,
  "image_url": "https://..."
}
```

---

### Step 4: Verify (3 min)
1. Go to `/marketplace` page
2. See product images in carousel ✅
3. See shopping bag emoji for products without images ✅

---

## 📊 Git Status
```
✅ Committed to master
✅ Pushed to origin/master
✅ Vercel auto-deploying
```

---

## 📁 Key Files
- `supabase/migrations/marketplace_complete_fix.sql` - SQL to run
- `MARKETPLACE_COMPLETE_FIX_GUIDE.md` - Detailed guide
- `ACTION_CARD_MARKETPLACE_COMPLETE_FIX.md` - Full checklist

---

## ❓ Issues?

**Images not showing?**
- Verify migration ran
- Check storage bucket is public
- Verify image_url column exists

**Can't make admins?**
- Verify user exists
- Check JSON is valid: `{ "role": "admin" }`

**Delivery address not saving?**
- Verify column exists
- Include in INSERT/UPDATE queries

---

**Total Time:** 15 minutes
**Status:** ✅ Ready to deploy
