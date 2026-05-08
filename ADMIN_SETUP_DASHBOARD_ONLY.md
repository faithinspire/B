# Make Users Admins - Dashboard Method ONLY ✅

## ⚠️ Important: SQL Does NOT Work

You got this error:
```
ERROR: 42501: permission denied for table users
```

**This is expected.** Supabase blocks ALL direct SQL access to `auth.users` table for security.

**Solution:** Use the Dashboard UI instead. It's actually faster and easier.

---

## Step-by-Step: Make 3 Users Admins

### Step 1: Open Supabase Dashboard
1. Go to **https://supabase.com/dashboard**
2. Click on your **BraidMee project**
3. You're now in the project dashboard

---

### Step 2: Go to Users List
1. In the left sidebar, click **Authentication**
2. Click **Users**
3. You'll see a list of all users who signed up

---

### Step 3: Make First User Admin

**Find a user you want to make admin:**
- Look through the list
- Click on their **email address** to open their profile

**Once the profile opens:**
1. Scroll down to find **"raw_user_meta_data"** section
2. You'll see a JSON object (might be empty `{}`)
3. Click the **pencil/edit icon** next to it

**In the JSON editor, add:**
```json
{
  "role": "admin"
}
```

**If there's already data, just add the role field:**
```json
{
  "existing_field": "value",
  "role": "admin"
}
```

4. Click **Save**
5. You'll see a confirmation message ✅

---

### Step 4: Repeat for 2 More Users

Go back to the Users list and repeat Step 3 for two more users.

**Result:** You now have 3 admins! ✅

---

## Verify It Worked

### Check Each Admin:
1. Go to **Authentication** → **Users**
2. Click on each user you made admin
3. Scroll to **raw_user_meta_data**
4. Verify it shows: `{ "role": "admin" }`

---

## What Admins Can Do

Once users have `role: admin` in their metadata, they can:
- Access `/admin` dashboard
- View all users, bookings, payments
- Manage braiders and customers
- View analytics and reports
- Approve/reject braider verifications

---

## Troubleshooting

### Problem: Can't find the user
- **Solution:** Use the search box at the top of Users list
- Search by email address

### Problem: raw_user_meta_data not showing
- **Solution:** Scroll down in the user profile
- It's usually at the bottom

### Problem: JSON format error
- **Solution:** Make sure:
  - Use double quotes: `"role"` not `'role'`
  - No trailing commas: `{"role": "admin"}` not `{"role": "admin",}`
  - Valid JSON structure

### Problem: Changes not saving
- **Solution:**
  - Click the Save button (not just close)
  - Wait for confirmation message
  - Refresh page and check again

---

## Quick Checklist

- [ ] Open https://supabase.com/dashboard
- [ ] Click your BraidMee project
- [ ] Go to Authentication → Users
- [ ] Find User 1 and click their email
- [ ] Edit raw_user_meta_data
- [ ] Add `{ "role": "admin" }`
- [ ] Click Save
- [ ] Repeat for User 2
- [ ] Repeat for User 3
- [ ] Verify all 3 have admin role

---

## Done! ✅

Your 3 admins can now log in and access `/admin` to manage the platform.

**Next Steps:**
1. Run the marketplace migration SQL in Supabase
2. Test uploading product images
3. Verify images display in marketplace

