# 🎯 ACTION CARD: Make bidemiobisakin@hotmail.com an ADMIN

## Status: Ready to Execute

**Email:** bidemiobisakin@hotmail.com  
**Current Role:** Braider (to be changed)  
**New Role:** Admin  
**SQL File:** `MAKE_BIDEMI_ADMIN.sql`

---

## Quick Steps

### Step 1: Execute SQL in Supabase
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Open file: `MAKE_BIDEMI_ADMIN.sql`
4. Copy and paste the SQL
5. Click "Run"

### Step 2: Verify the Change
The SQL will output:
```
email                          | role  | verification_status
bidemiobisakin@hotmail.com     | admin | unverified
```

### Step 3: Test Login
1. Login to app as bidemiobisakin@hotmail.com
2. Should see Admin Dashboard (not Braider Dashboard)
3. Should have access to all admin features

---

## What the SQL Does

✅ Updates `profiles` table: Sets role to 'admin'  
✅ Updates `braider_profiles` table: Sets verification_status to 'unverified'  
✅ Verifies the changes with a SELECT query  
✅ All in a transaction (COMMIT/ROLLBACK safe)

---

## SQL Content

```sql
-- Make bidemiobisakin@hotmail.com an ADMIN instead of BRAIDER
BEGIN;

WITH user_data AS (
  SELECT id, email FROM auth.users 
  WHERE email = 'bidemiobisakin@hotmail.com'
)

UPDATE profiles 
SET role = 'admin'
WHERE id IN (SELECT id FROM user_data);

UPDATE braider_profiles
SET verification_status = 'unverified'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'bidemiobisakin@hotmail.com'
);

SELECT 
  u.email,
  p.role,
  bp.verification_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN braider_profiles bp ON u.id = bp.user_id
WHERE u.email = 'bidemiobisakin@hotmail.com';

COMMIT;
```

---

## Verification Checklist

After running the SQL:

- [ ] SQL executed without errors
- [ ] Output shows role = 'admin'
- [ ] User can login
- [ ] Admin dashboard is accessible
- [ ] Braider dashboard is NOT accessible

---

## Rollback (if needed)

If you need to revert this change:

```sql
UPDATE profiles 
SET role = 'braider'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'bidemiobisakin@hotmail.com'
);
```

---

## Done! ✅

User bidemiobisakin@hotmail.com is now an ADMIN.
