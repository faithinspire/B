# CRITICAL FIXES - Current Session

## Issues to Fix

### 1. PRODUCTS NOT SHOWING IN MARKETPLACE
**Root Cause**: Products are being added but not displaying on homepage/marketplace

**Issues**:
- Products added to store are not appearing
- Product photos not showing in homepage
- No products visible in marketplace page

**Root Analysis**:
- The `marketplace_products` table may have RLS policies blocking reads
- Products may not have `is_active = true` set
- Image URLs may not be properly stored or accessible
- The API endpoint may be filtering out products incorrectly

**Fix Required**:
1. Disable RLS on `marketplace_products` table
2. Ensure all products have `is_active = true`
3. Verify image URLs are stored correctly
4. Check storage bucket permissions for product images

---

### 2. ADMIN ACCOUNT NOT SHOWING FOR bidemiobisakin@hotmail.com
**Root Cause**: Account still showing braider profile instead of admin

**Issues**:
- User logs in but sees braider dashboard instead of admin dashboard
- Braider profile still exists in database
- Role may not be properly updated

**Fix Required**:
1. Execute SQL to DELETE braider_profiles record
2. Update profiles role to 'admin'
3. Clear any cached role data
4. Verify with SELECT query

---

### 3. PASSWORD RESET EMAIL NOT SHOWING RESET LINK
**Root Cause**: Email is being sent but reset link not visible in email body

**Issues**:
- Password reset emails arrive but no clickable link
- Reset link may not be rendering in email client
- HTML email formatting issue

**Fix Required**:
1. Verify reset link is being generated correctly
2. Check email HTML formatting
3. Ensure Brevo is sending HTML emails correctly
4. Add plain text version of reset link

---

## SQL FIXES TO RUN

### Fix 1: Disable RLS on marketplace_products and ensure products are active

```sql
-- Disable RLS on marketplace_products table
ALTER TABLE marketplace_products DISABLE ROW LEVEL SECURITY;

-- Ensure all products are marked as active
UPDATE marketplace_products 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- Verify products exist
SELECT COUNT(*) as total_products, 
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM marketplace_products;
```

### Fix 2: Make bidemiobisakin@hotmail.com an ADMIN

```sql
BEGIN;

-- Get user ID
WITH user_data AS (
  SELECT id FROM auth.users 
  WHERE email = 'bidemiobisakin@hotmail.com'
)

-- DELETE braider profile completely
DELETE FROM braider_profiles
WHERE user_id IN (SELECT id FROM user_data);

-- Update to admin role
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE id IN (SELECT id FROM user_data);

-- Verify
SELECT 
  u.id,
  u.email,
  p.role,
  bp.id as braider_profile_exists
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN braider_profiles bp ON u.id = bp.user_id
WHERE u.email = 'bidemiobisakin@hotmail.com';

COMMIT;
```

### Fix 3: Disable RLS on storage for product images

```sql
-- Disable RLS on storage.objects if it exists
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Make product-images bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'product-images';
```

---

## CODE FIXES REQUIRED

### Fix 1: Update forgot-password route to ensure reset link is in email

**File**: `app/api/auth/forgot-password/route.ts`

The reset link IS being included in the HTML. The issue might be:
1. Email client not rendering HTML properly
2. Link text not visible (color issue)
3. Plain text version missing

**Action**: Add plain text version and improve link visibility

### Fix 2: Update marketplace products API to handle RLS properly

**File**: `app/api/marketplace/products/route.ts`

Current code tries to filter by `is_active` but may fail if RLS blocks access.

**Action**: Add better error handling and ensure service role is used

### Fix 3: Update marketplace page to handle empty products

**File**: `app/(public)/marketplace/page.tsx`

May not be showing "no products" message properly.

**Action**: Add better empty state handling

---

## IMMEDIATE ACTIONS

1. **Execute SQL Fix 1** in Supabase SQL Editor
   - Disable RLS on marketplace_products
   - Set all products to is_active = true
   - Verify count

2. **Execute SQL Fix 2** in Supabase SQL Editor
   - Make bidemiobisakin@hotmail.com admin
   - Verify with SELECT query

3. **Execute SQL Fix 3** in Supabase SQL Editor
   - Disable RLS on storage
   - Make product-images bucket public

4. **Test**:
   - Login as bidemiobisakin@hotmail.com → should see admin dashboard
   - Check marketplace → should see products
   - Request password reset → should receive email with visible link

---

## VERIFICATION CHECKLIST

- [ ] Products showing in marketplace
- [ ] Product images displaying
- [ ] bidemiobisakin@hotmail.com shows admin dashboard
- [ ] Password reset email contains clickable link
- [ ] All 4 issues resolved

