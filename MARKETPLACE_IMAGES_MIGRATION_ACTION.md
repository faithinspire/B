# Marketplace Product Images - SQL Migration Action

## Current Status
✅ SQL migration file is **CORRECTED** and ready to execute
- File: `supabase/migrations/marketplace_products_images.sql`
- The syntax error has been fixed (uses `ON CONFLICT (id) DO NOTHING`)

## What This Migration Does
1. Adds `image_url` column to `marketplace_products` table
2. Creates `marketplace-products` storage bucket for image uploads
3. Sets bucket as public so images can be accessed via URL

## CRITICAL NEXT STEP: Execute in Supabase

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add image_url column to marketplace_products table if it doesn't exist
ALTER TABLE marketplace_products
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create marketplace-products storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'marketplace-products',
  'marketplace-products',
  NULL,
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

5. Click **Run** button
6. Verify: No errors should appear

### Option 2: Via Supabase CLI
```bash
supabase db push
```

## Verification After Running
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query to verify the column was added:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'marketplace_products' AND column_name = 'image_url';
```
Should return: `image_url`

3. Check storage bucket exists:
   - Go to **Storage** section in Supabase Dashboard
   - Look for `marketplace-products` bucket
   - Should be marked as public

## After Migration is Complete
1. The image upload endpoint is ready at: `app/api/marketplace/products/upload-image/route.ts`
2. The carousel will display product images: `app/components/MarketplaceCarousel.tsx`
3. Marketplace page will show images: `app/(public)/marketplace/page.tsx`
4. Vercel will auto-deploy when migration is complete

## If You Get an Error
- **"bucket already exists"**: This is OK - the `ON CONFLICT` clause handles it
- **"column already exists"**: This is OK - the `IF NOT EXISTS` handles it
- **Other errors**: Check that you're in the correct Supabase project

---

**Status**: Ready to execute ✅
**Blocker**: Waiting for SQL execution in Supabase
