-- Run this in Supabase SQL Editor to activate all marketplace products
-- This fixes the "No products" issue by setting is_active = true for all products

-- First, check how many products exist
SELECT COUNT(*) as total_products, 
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
       COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products,
       COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_products
FROM marketplace_products;

-- Activate ALL products (set is_active = true for all)
UPDATE marketplace_products 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- Verify the fix
SELECT id, name, is_active, created_at 
FROM marketplace_products 
ORDER BY created_at DESC 
LIMIT 20;
