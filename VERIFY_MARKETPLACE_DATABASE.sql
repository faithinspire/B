-- Verify marketplace database setup

-- 1. Check if marketplace_products table exists and has data
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products
FROM marketplace_products;

-- 2. Show sample active products
SELECT 
  id,
  name,
  price,
  currency,
  category,
  is_active,
  braider_id,
  created_at
FROM marketplace_products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check marketplace_categories table
SELECT 
  id,
  name,
  slug,
  icon_emoji,
  created_at
FROM marketplace_categories
ORDER BY created_at DESC;

-- 4. Check if there are any products at all
SELECT 
  COUNT(*) as total_all_products
FROM marketplace_products;

-- 5. Check for any errors or issues
SELECT 
  id,
  name,
  is_active,
  created_at,
  CASE 
    WHEN image_url IS NULL THEN 'Missing image'
    WHEN price IS NULL THEN 'Missing price'
    WHEN category IS NULL THEN 'Missing category'
    WHEN braider_id IS NULL THEN 'Missing braider'
    ELSE 'OK'
  END as status
FROM marketplace_products
LIMIT 20;

-- 6. Check RLS policies on marketplace_products
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'marketplace_products'
ORDER BY policyname;
