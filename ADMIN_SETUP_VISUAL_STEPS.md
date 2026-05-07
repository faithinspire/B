# Admin Setup - Visual Step-by-Step Guide

## 🎯 Goal: Make 3 Existing Users Admins

---

## STEP 1: Open Supabase Dashboard

**What to do:**
1. Open your browser
2. Go to: `https://supabase.com/dashboard`
3. Log in with your account
4. Select your project (BraidMe)

**What you'll see:**
- Project overview page
- Left sidebar with options

---

## STEP 2: Navigate to Users

**What to do:**
1. In the left sidebar, find **Authentication**
2. Click on **Authentication**
3. A submenu appears
4. Click on **Users**

**What you'll see:**
- A table with all users who signed up
- Columns: Email, Created At, Last Sign In, etc.
- A search box at the top

---

## STEP 3: Find First User

**What to do:**
1. Look through the users list
2. Find someone you want to make admin
3. You can search by email if needed

**Example users you might see:**
```
Email                    | Created At           | Last Sign In
user1@example.com        | May 1, 2026          | May 5, 2026
user2@example.com        | April 28, 2026       | May 3, 2026
user3@example.com        | April 15, 2026       | May 6, 2026
```

**Pick any 3 users** - they'll become your admins.

---

## STEP 4: Open User Profile

**What to do:**
1. Click on the user's **email address** (it's a link)
2. The user profile page opens

**What you'll see:**
- User ID
- Email
- Created date
- Last sign in
- **raw_user_meta_data** section (scroll down to find it)

---

## STEP 5: Edit raw_user_meta_data

**What to do:**
1. Scroll down to find **"raw_user_meta_data"**
2. You'll see a JSON object (might look like `{}` or have data)
3. Look for a **pencil icon** or **edit button** next to it
4. Click the edit button

**What you'll see:**
- A text editor opens
- Shows the current JSON data
- Cursor ready for editing

---

## STEP 6: Add Admin Role

**Current state (before):**
```json
{}
```

or

```json
{
  "some_field": "some_value"
}
```

**What to do:**
1. If empty `{}`, replace with:
```json
{
  "role": "admin"
}
```

2. If has existing data, add the role field:
```json
{
  "some_field": "some_value",
  "role": "admin"
}
```

**Important:**
- Use double quotes: `"role"` not `'role'`
- No trailing commas
- Valid JSON format

---

## STEP 7: Save Changes

**What to do:**
1. Look for a **Save** button (usually at bottom right)
2. Click **Save**

**What you'll see:**
- Success message appears
- "User updated successfully" or similar
- The editor closes

**Result:** ✅ User 1 is now an admin!

---

## STEP 8: Repeat for User 2

**What to do:**
1. Go back to Users list (click back or Users in sidebar)
2. Find second user
3. Click their email
4. Scroll to raw_user_meta_data
5. Click edit
6. Add `"role": "admin"`
7. Click Save

**Result:** ✅ User 2 is now an admin!

---

## STEP 9: Repeat for User 3

**What to do:**
1. Go back to Users list
2. Find third user
3. Click their email
4. Scroll to raw_user_meta_data
5. Click edit
6. Add `"role": "admin"`
7. Click Save

**Result:** ✅ User 3 is now an admin!

---

## STEP 10: Verify All 3 Admins

**What to do:**
1. Go to **SQL Editor** (in left sidebar)
2. Click **New Query**
3. Copy and paste this SQL:

```sql
SELECT id, email, raw_user_meta_data->>'role' as role, created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
```

4. Click **Run**

**What you'll see:**
- A table with 3 rows
- Each row shows: ID, Email, Role (admin), Created At

**Example result:**
```
id                                   | email              | role  | created_at
-------------------------------------|-------------------|-------|------------------
550e8400-e29b-41d4-a716-446655440000 | admin1@example.com | admin | 2026-05-01
550e8400-e29b-41d4-a716-446655440001 | admin2@example.com | admin | 2026-04-28
550e8400-e29b-41d4-a716-446655440002 | admin3@example.com | admin | 2026-04-15
```

**Result:** ✅ All 3 admins confirmed!

---

## 🎉 Done!

You now have 3 admins who can:
- Log in to the app
- Go to `/admin` page
- Access admin dashboard
- Manage users, bookings, payments, etc.

---

## 📋 Quick Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to Authentication → Users
- [ ] Make User 1 admin (edit raw_user_meta_data, add role)
- [ ] Make User 2 admin (same steps)
- [ ] Make User 3 admin (same steps)
- [ ] Run SQL query to verify all 3 admins
- [ ] Test: Have one admin log in and go to `/admin`

---

## ❓ Common Issues

### "I can't find raw_user_meta_data"
- Scroll down in the user profile
- It's usually at the bottom
- Or use SQL method instead

### "Edit button not showing"
- Look for a pencil icon
- Or double-click the JSON field
- Or use SQL method instead

### "JSON error when saving"
- Check for typos: `"role"` not `'role'`
- No trailing commas
- Valid JSON format
- Try copying from this guide exactly

### "Changes not saving"
- Make sure you click Save button
- Wait for success message
- Refresh page and check again

---

## 🚀 Next Steps

1. **Test Admin Access:**
   - Have one admin log in
   - Go to `/admin` URL
   - Should see admin dashboard

2. **Set Admin Permissions:**
   - Admins can now manage the platform
   - They can approve braiders
   - They can view payments
   - They can manage users

3. **Add More Admins Later:**
   - Follow same steps anytime
   - Can have more than 3 if needed

---

**Time to complete:** ~10 minutes
**Difficulty:** Easy
**Status:** Ready to go! ✅
