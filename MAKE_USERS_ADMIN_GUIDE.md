# How to Make Existing Users Admins (3 Users)

## Overview
Users who signed up before can be made admins by updating their user metadata in Supabase. This guide shows you exactly how to do it.

---

## Method 1: Via Supabase Dashboard (Easiest - Recommended)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **Users**

You'll see a list of all users who have signed up.

---

### Step 2: Find the First User to Make Admin

Look through the users list and find someone you want to make admin. You can see:
- Email address
- Sign-up date
- Last sign-in date

Click on the user's **email address** to open their profile.

---

### Step 3: Edit User Metadata

Once you open the user profile, you'll see their details:

1. Scroll down to find **"raw_user_meta_data"** section
2. You'll see a JSON object (might be empty `{}` or have existing data)
3. Click the **edit icon** (pencil icon) next to it

---

### Step 4: Add Admin Role

In the JSON editor, add or update the role field:

**If the field is empty:**
```json
{
  "role": "admin"
}
```

**If there's already data:**
```json
{
  "existing_field": "value",
  "role": "admin"
}
```

Just make sure `"role": "admin"` is included.

---

### Step 5: Save

Click the **Save** button to save the changes.

You'll see a confirmation message. The user is now an admin! ✅

---

### Step 6: Repeat for 2 More Users

Go back to the Users list and repeat steps 2-5 for two more users.

**Result:** You now have 3 admins! ✅

---

## Method 2: Via SQL (If Dashboard Method Doesn't Work)

If you prefer using SQL or the dashboard method isn't working:

### Step 1: Get User IDs

Go to **SQL Editor** in Supabase and run:

```sql
SELECT id, email FROM auth.users LIMIT 10;
```

This shows you the user IDs and emails. Copy the IDs of the 3 users you want to make admin.

---

### Step 2: Make Each User Admin

For each user, run this SQL query (replace `USER_ID_HERE` with actual ID):

```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE id = 'USER_ID_HERE';
```

**Example:**
```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

Run this 3 times with 3 different user IDs.

---

## Verify Admins Were Created

### Via Dashboard:
1. Go to **SQL Editor**
2. Run this query:

```sql
SELECT id, email, raw_user_meta_data->>'role' as role, created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
```

You should see 3 users with `role = admin`

---

## Troubleshooting

### Problem: Can't find the user in the list
- **Solution:** Use the search box at the top of the Users list
- Search by email address

### Problem: raw_user_meta_data field is not showing
- **Solution:** It might be hidden. Scroll down in the user profile
- Or use Method 2 (SQL) instead

### Problem: JSON format error when editing
- **Solution:** Make sure your JSON is valid:
  - Use double quotes: `"role"` not `'role'`
  - No trailing commas: `{"role": "admin"}` not `{"role": "admin",}`
  - Proper structure: `{ "key": "value" }`

### Problem: Changes not saving
- **Solution:** 
  - Click the Save button (not just close the editor)
  - Wait for confirmation message
  - Refresh the page and check again

---

## What Admins Can Do

Once users are admins (have `role: admin` in metadata), they can:
- Access admin dashboard at `/admin`
- View all users, bookings, payments
- Manage braiders and customers
- View analytics and reports
- Approve/reject braider verifications

---

## Quick Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to Authentication → Users
- [ ] Find first user to make admin
- [ ] Click on their email
- [ ] Edit raw_user_meta_data
- [ ] Add `{ "role": "admin" }`
- [ ] Click Save
- [ ] Repeat for 2 more users
- [ ] Verify all 3 admins using SQL query

---

## Done! ✅

You now have 3 admins who can access the admin dashboard and manage your platform.

**Next:** They can log in and go to `/admin` to access the admin panel.
