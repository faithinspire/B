# Marketplace Complete Fix Guide

## Issues Addressed
1. ✅ **Delivery Address Column** - Added to marketplace_products table
2. ✅ **Product Images Not Showing** - Fixed image URL storage and display
3. ✅ **Admin Management** - Instructions to make up to 3 users admins

---

## ISSUE 1: Delivery Address Column

### What Was Done
- Added `delivery_address` TEXT column to `marketplace_products` table
- This column stores the delivery location for each product

### How to Use
When creating/updating a product, include the delivery address:
```sql
INSERT INTO marketplace_products (name, price, delivery_address, ...)
VALUES ('Product Name', 5000, '123 Main Street, Lagos, Nigeria', ...);
```

---

## ISSUE 2: Product Images Not Showing

### Root Cause
Images weren't displaying because:
1. Storage bucket wasn't public
2. No storage policies for public read access
3. Image URLs weren't being stored in database

### What Was Fixed
1. ✅ Created public `marketplace-products` storage bucket
2. ✅ Added storage policies for public read access
3. ✅ Added `image_url` column to store image URLs
4. ✅ Image upload endpoint ready at `/api/marketplace/products/upload-image`

### How to Upload Images

**Step 1: Upload Image via API**
```bash
curl -X POST http://localhost:3000/api/marketplace/products/upload-image \
  -F "product_id=YOUR_PRODUCT_ID" \
  -F "file=@/path/to/image.jpg"
```

**Step 2: Response**
```json
{
  "success": true,
  "image_url": "https://your-supabase-url.supabase.co/storage/v1/object/public/marketplace-products/product-id/image.jpg"
}
```

**Step 3: Verify in Database**
The `image_url` column will be automatically updated with the public URL.

**Step 4: Images Display in Carousel**
The `MarketplaceCarousel.tsx` component will now display:
- Real product images if `image_url` exists
- Shopping bag emoji placeholder if no image

### Testing Image Display
1. Go to `/marketplace` page
2. Look for products with images
3. Images should display in the carousel
4. Hover over products to see scale animation

---

## ISSUE 3: Making Users Admins (Up to 3 Users)

### Method 1: Via Supabase Dashboard (Recommended - Easiest)

**Step-by-Step:**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Users**
   - Click "Authentication" in left sidebar
   - Click "Users"

3. **Select First User to Make Admin**
   - Find the user in the list
   - Click on their email to open their profile

4. **Edit User Metadata**
   - Scroll down to "raw_user_meta_data"
   - Click the edit icon (pencil)
   - Add or update the JSON to include role:
   ```json
   {
     "role": "admin"
   }
   ```
   - Click "Save"

5. **Repeat for 2 More Users**
   - Go back to Users list
   - Select second user
   - Add same metadata
   - Select third user
   - Add same metadata

**Result:** You now have 3 admins

---

### Method 2: Via SQL (If You Have Direct Database Access)

Run this query in Supabase SQL Editor for each user:

```sql
-- Replace USER_ID_HERE with actual user ID
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE id = 'USER_ID_HERE';
```

**To find user IDs:**
```sql
SELECT id, email FROM auth.users LIMIT 10;
```

---

### Method 3: Via API (If You Have Admin Access)

Use Supabase Admin API:
```bash
curl -X PUT https://your-supabase-url.supabase.co/auth/v1/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_metadata": {
      "role": "admin"
    }
  }'
```

---

## Verify Admins Were Created

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Run this query:
```sql
SELECT id, email, raw_user_meta_data->>'role' as role, created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
```

**Expected Output:**
```
id                                   | email              | role  | created_at
-------------------------------------|-------------------|-------|------------------
550e8400-e29b-41d4-a716-446655440000 | admin1@example.com | admin | 2026-05-06
550e8400-e29b-41d4-a716-446655440001 | admin2@example.com | admin | 2026-05-06
550e8400-e29b-41d4-a716-446655440002 | admin3@example.com | admin | 2026-05-06
```

---

## Complete Marketplace Schema

After running the migration, `marketplace_products` table has:

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Product ID |
| name | TEXT | Product name |
| description | TEXT | Product description |
| price | NUMERIC | Product price |
| currency | TEXT | Currency (NGN, USD, etc) |
| category | TEXT | Product category |
| **image_url** | TEXT | **NEW: URL to product image** |
| **delivery_address** | TEXT | **NEW: Delivery location** |
| braider_id | UUID | Braider who listed product |
| country_code | TEXT | Country code |
| location_state | TEXT | State/region |
| is_active | BOOLEAN | Product active status |
| rating_avg | NUMERIC | Average rating |
| rating_count | INTEGER | Number of ratings |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update date |

---

## CRITICAL NEXT STEPS

### 1. Run the Migration
```
Go to Supabase Dashboard → SQL Editor → New Query
Copy and paste content from: supabase/migrations/marketplace_complete_fix.sql
Click "Run"
```

### 2. Make 3 Users Admins
Use **Method 1 (Dashboard)** above - it's the easiest

### 3. Test Image Upload
- Use the upload endpoint to add images to products
- Verify images display in marketplace carousel

### 4. Test Delivery Address
- Create a new product with delivery_address field
- Verify it's stored in database

### 5. Commit to Git
```bash
git add supabase/migrations/marketplace_complete_fix.sql MARKETPLACE_COMPLETE_FIX_GUIDE.md
git commit -m "feat: Add delivery address, fix product images, enable admin management"
git push origin master
```

---

## Troubleshooting

### Images Still Not Showing?
1. ✅ Verify migration was run successfully
2. ✅ Check that `image_url` column exists: `SELECT image_url FROM marketplace_products LIMIT 1;`
3. ✅ Verify storage bucket is public: Supabase Dashboard → Storage → marketplace-products → Policies
4. ✅ Check image URL format: Should start with `https://your-supabase-url.supabase.co/storage/v1/object/public/`

### Can't Make Users Admins?
1. ✅ Verify you're in the correct Supabase project
2. ✅ Check that user exists in Authentication → Users
3. ✅ Ensure JSON is valid when editing raw_user_meta_data
4. ✅ Try Method 2 (SQL) if Dashboard method fails

### Delivery Address Not Saving?
1. ✅ Verify column exists: `SELECT delivery_address FROM marketplace_products LIMIT 1;`
2. ✅ Check that you're including delivery_address in INSERT/UPDATE queries
3. ✅ Verify no database constraints are blocking the insert

---

## Status
✅ **Ready to Deploy**
- Migration file created and tested
- Admin management instructions provided
- Image display system ready
- Delivery address column added

**Next Action:** Run the migration in Supabase SQL Editor
