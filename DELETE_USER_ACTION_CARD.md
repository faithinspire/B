# 🗑️ Delete User: bidemiobisakin@hotmail.com

## Quick Delete Options

### Option 1: Using the API Endpoint (Easiest)

```bash
curl -X POST http://localhost:3000/api/admin/delete-user-by-email \
  -H "Content-Type: application/json" \
  -d '{"email":"bidemiobisakin@hotmail.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User bidemiobisakin@hotmail.com has been deleted",
  "userId": "user-id-here"
}
```

---

### Option 2: Using Supabase Dashboard (Manual)

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Users**
4. Search for `bidemiobisakin@hotmail.com`
5. Click the user
6. Click **Delete user** button
7. Confirm deletion

---

### Option 3: Using SQL (Direct Database)

Run this SQL in Supabase SQL Editor:

```sql
-- Delete user and all related data
BEGIN;

-- Delete from braider_profiles
DELETE FROM public.braider_profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'bidemiobisakin@hotmail.com');

-- Delete from profiles
DELETE FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'bidemiobisakin@hotmail.com');

-- Delete from auth.users
DELETE FROM auth.users 
WHERE email = 'bidemiobisakin@hotmail.com';

COMMIT;

-- Verify
SELECT COUNT(*) as remaining FROM auth.users WHERE email = 'bidemiobisakin@hotmail.com';
```

---

## What Gets Deleted

When you delete this user, the following will be removed:

- ✅ Auth user account
- ✅ User profile data
- ✅ Braider profile (if applicable)
- ✅ All associated bookings/transactions (cascading deletes)
- ✅ Messages and conversations
- ✅ Verification documents

---

## Recommended Approach

**Use Option 1 (API Endpoint)** - It's the safest and handles all cascading deletes properly.

1. Start dev server: `npm run dev`
2. Run the curl command above
3. Check response for success

---

## Verification

After deletion, verify the user is gone:

```bash
curl http://localhost:3000/api/admin/users | grep bidemiobisakin@hotmail.com
```

Should return no results.

---

## Undo

⚠️ **Warning:** User deletion is permanent. There is no undo.

If you need to restore the user, you'll need to:
1. Restore from database backup
2. Or have the user sign up again

---

## Status

- ✅ API endpoint created: `/api/admin/delete-user-by-email`
- ✅ SQL script available: `DELETE_USER_EMAIL.sql`
- ✅ Ready to execute

Choose your preferred method above and execute!
