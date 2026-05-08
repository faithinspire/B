# Fix: Supabase Permission Denied Error

## Error Message
```
Failed to run sql query: ERROR:  42501: permission denied for table users
HINT:  Grant the required privileges to the current role with: 
GRANT SELECT, UPDATE ON auth.users TO authenticated;
```

## What This Means
You tried to query or update the `auth.users` table directly via SQL, but Supabase doesn't allow this for security reasons. The `auth.users` table is protected and can only be modified through the Supabase Dashboard UI.

---

## Solution: Use Dashboard Only

You **cannot** use SQL to make users admins. You **must** use the Supabase Dashboard.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Go to Users**
   - Click **Authentication** in left sidebar
   - Click **Users**

3. **For Each User (3 times):**
   - Click on user's email
   - Scroll to **raw_user_meta_data**
   - Click edit (pencil icon)
   - Add: `{ "role": "admin" }`
   - Click Save

4. **Done!** ✅

---

## Why SQL Doesn't Work

Supabase's `auth.users` table is in the `auth` schema, which has special security restrictions:
- ❌ Cannot be queried directly via SQL
- ❌ Cannot be updated via SQL
- ✅ Can only be modified via Dashboard UI
- ✅ Can only be modified via Supabase Admin API (with service role key)

This is intentional for security - to prevent accidental data loss or unauthorized access.

---

## Alternative: Use Supabase Admin API

If you need to automate this, you can use the Supabase Admin API with your service role key:

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

But for now, **use the Dashboard method** - it's the easiest.

---

## Quick Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to Authentication → Users
- [ ] Make User 1 admin (edit raw_user_meta_data)
- [ ] Make User 2 admin (same steps)
- [ ] Make User 3 admin (same steps)
- [ ] Verify each user has `{ "role": "admin" }` in metadata

---

## Status
✅ **Dashboard method works**
❌ **SQL method blocked by Supabase**
✅ **Admin API method available (advanced)**

**Recommendation:** Use Dashboard - it's the simplest and most reliable.
