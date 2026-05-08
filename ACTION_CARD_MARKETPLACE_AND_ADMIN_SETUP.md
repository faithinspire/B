# Action Card: Marketplace Fix + Admin Setup

## Status: Ready to Execute ✅

You have 3 tasks to complete. Here's the exact order:

---

## TASK 1: Run Marketplace Migration SQL ⚡

**What it does:**
- Adds `delivery_address` column to products
- Adds `image_url` column to products
- Creates public storage bucket for product images
- Sets up storage policies for uploads

**How to do it:**

1. Go to **https://supabase.com/dashboard**
2. Select your **BraidMee project**
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy ALL content from this file:
   ```
   supabase/migrations/marketplace_complete_fix.sql
   ```
6. Paste it into the SQL editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for success message ✅

**Expected result:**
- No errors
- Message: "Query executed successfully"

**Verify it worked:**
```sql
-- Run this query to check:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'marketplace_products' 
AND column_name IN ('image_url', 'delivery_address');
```

Should show both columns exist.

---

## TASK 2: Make 3 Users Admins 👥

**What it does:**
- Gives 3 users admin access to `/admin` dashboard
- Allows them to manage users, bookings, payments, etc.

**How to do it:**

1. Go to **https://supabase.com/dashboard**
2. Select your **BraidMee project**
3. Click **Authentication** → **Users**
4. For each of 3 users:
   - Click their **email address**
   - Scroll to **raw_user_meta_data**
   - Click **edit icon** (pencil)
   - Add: `{ "role": "admin" }`
   - Click **Save**

**Repeat 3 times for 3 different users.**

**Verify it worked:**
- Click on each admin user
- Check raw_user_meta_data shows `{ "role": "admin" }`

**See detailed guide:** `ADMIN_SETUP_DASHBOARD_ONLY.md`

---

## TASK 3: Test Image Upload (Optional but Recommended) 📸

**What it does:**
- Tests that the image upload endpoint works
- Verifies images display in marketplace

**How to do it:**

1. Go to your app at `/marketplace`
2. As a braider, create a new product
3. Upload a product image
4. Verify image displays in carousel
5. Check that `image_url` is saved in database

**If images don't show:**
- Check browser console for errors
- Verify storage bucket is public
- Check image file size (max 5MB)

---

## Summary of Changes

### Database Changes (Task 1)
- ✅ `marketplace_products.delivery_address` (TEXT)
- ✅ `marketplace_products.image_url` (TEXT)
- ✅ Storage bucket: `marketplace-products` (public)
- ✅ Storage policies for public read + authenticated upload

### User Changes (Task 2)
- ✅ User 1: `role: admin`
- ✅ User 2: `role: admin`
- ✅ User 3: `role: admin`

### Code Changes (Already Done)
- ✅ Image upload endpoint: `/api/marketplace/products/upload-image`
- ✅ Marketplace carousel with image display
- ✅ Marketplace page with filters and search

---

## Files to Reference

**For Task 1 (SQL):**
- `supabase/migrations/marketplace_complete_fix.sql`

**For Task 2 (Admin Setup):**
- `ADMIN_SETUP_DASHBOARD_ONLY.md`
- `MAKE_USERS_ADMIN_GUIDE.md`

**For Task 3 (Testing):**
- `app/api/marketplace/products/upload-image/route.ts`
- `app/components/MarketplaceCarousel.tsx`
- `app/(public)/marketplace/page.tsx`

---

## Execution Order

1. **First:** Run SQL migration (Task 1)
2. **Second:** Make 3 users admins (Task 2)
3. **Third:** Test image upload (Task 3)

---

## After Completion

Once all 3 tasks are done:

1. **Commit to git:**
   ```bash
   git add .
   git commit -m "feat: Complete marketplace and admin setup"
   git push origin master
   ```

2. **Vercel will auto-deploy** to production

3. **Test in production:**
   - Go to `/marketplace`
   - Upload product images
   - Go to `/admin` as admin user
   - Verify admin dashboard works

---

## Troubleshooting

### SQL Error: "permission denied for table users"
- **This is expected.** Don't try to run SQL for admin setup.
- Use Dashboard UI instead (Task 2).

### Images not showing in marketplace
- Check storage bucket is public
- Verify image_url is saved in database
- Check browser console for errors
- Max file size is 5MB

### Admin can't access `/admin`
- Verify user has `role: admin` in raw_user_meta_data
- Refresh page
- Clear browser cache
- Try logging out and back in

---

## Status: Ready ✅

All code is written and committed. You just need to:
1. Run the SQL migration
2. Make 3 users admins via Dashboard
3. Test image upload

**Estimated time:** 10-15 minutes

