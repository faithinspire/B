-- ============================================================================
-- MARKETPLACE COMPLETE FIX
-- Adds: delivery_address column, fixes image display, enables admin management
-- ============================================================================

-- 1. ADD DELIVERY_ADDRESS COLUMN TO MARKETPLACE_PRODUCTS
ALTER TABLE marketplace_products
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- 2. ADD IMAGE_URL COLUMN (if not already present)
ALTER TABLE marketplace_products
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. CREATE MARKETPLACE-PRODUCTS STORAGE BUCKET
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

-- 4. CREATE STORAGE POLICY FOR PUBLIC READ ACCESS
CREATE POLICY "Public read access for marketplace products"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-products');

-- 5. CREATE STORAGE POLICY FOR AUTHENTICATED UPLOAD
CREATE POLICY "Authenticated users can upload to marketplace-products"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'marketplace-products' AND auth.role() = 'authenticated');

-- 6. ENSURE ADMIN ROLE EXISTS IN AUTH.USERS
-- Note: To make users admins, update their raw_user_meta_data in Supabase Dashboard:
-- Go to Authentication → Users → Select user → Edit user → raw_user_meta_data
-- Add: { "role": "admin" }

-- 7. CREATE ADMIN MANAGEMENT VIEW (for easier querying)
CREATE OR REPLACE VIEW admin_users AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';

-- ============================================================================
-- INSTRUCTIONS FOR MAKING USERS ADMINS (3 methods)
-- ============================================================================

-- METHOD 1: Via Supabase Dashboard (Easiest)
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to Authentication → Users
-- 4. Click on the user you want to make admin
-- 5. Click "Edit user"
-- 6. Scroll to "raw_user_meta_data"
-- 7. Add or update: { "role": "admin" }
-- 8. Click "Save"

-- METHOD 2: Via SQL (if you have direct database access)
-- Run this query for each user (replace with actual user IDs):
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"admin"'::jsonb
-- )
-- WHERE id = 'USER_ID_HERE';

-- METHOD 3: Via API (if you have admin access)
-- Use the Supabase Admin API to update user metadata

-- ============================================================================
-- VERIFY ADMINS WERE CREATED
-- ============================================================================
-- Run this query to see all current admins:
-- SELECT * FROM admin_users;

-- ============================================================================
-- MARKETPLACE SCHEMA SUMMARY
-- ============================================================================
-- marketplace_products table now has:
-- - id (UUID, primary key)
-- - name (TEXT)
-- - description (TEXT)
-- - price (NUMERIC)
-- - currency (TEXT)
-- - category (TEXT)
-- - image_url (TEXT) ← NEW: stores URL to product image
-- - delivery_address (TEXT) ← NEW: delivery location
-- - braider_id (UUID, foreign key)
-- - country_code (TEXT)
-- - location_state (TEXT)
-- - is_active (BOOLEAN)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
-- - rating_avg (NUMERIC)
-- - rating_count (INTEGER)

-- ============================================================================
-- IMAGE UPLOAD ENDPOINT
-- ============================================================================
-- Endpoint: POST /api/marketplace/products/upload-image
-- Parameters:
--   - product_id: UUID of the product
--   - file: Image file (JPEG, PNG, WebP, GIF)
-- Returns:
--   - image_url: Public URL to the uploaded image
--   - success: boolean

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Make 3 users admins using METHOD 1 (Dashboard) above
-- 3. Upload product images using the upload endpoint
-- 4. Verify images display in marketplace carousel
-- 5. Test delivery_address field in product creation
