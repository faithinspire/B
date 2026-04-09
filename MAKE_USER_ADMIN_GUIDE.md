# How to Make a User an Admin - Complete Guide

## 🎯 Three Ways to Make a User Admin

### Method 1: Using Admin Users Page (Easiest) ✅

**Step 1: Go to Admin Users Page**
1. Login to your app as an admin
2. Go to `/admin/users`
3. You should see all users with real names

**Step 2: Find the User**
1. Use the search box to find the user by name or email
2. Or scroll through the list

**Step 3: Make Them Admin**
1. Click on the user's row
2. Look for "Make Admin" button or role selector
3. Change role from "Customer" or "Braider" to "Admin"
4. Click Save

**Result**: User is now an admin!

---

### Method 2: Using Supabase SQL (Direct Database)

**Step 1: Open Supabase SQL Editor**
1. Go to your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**

**Step 2: Run This SQL**

Replace `[USER_EMAIL]` with the actual email address:

```sql
-- Make a user an admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = '[USER_EMAIL]';

-- Verify the change
SELECT id, email, full_name, role FROM public.profiles WHERE email = '[USER_EMAIL]';
```

**Example:**
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'john@example.com';

SELECT id, email, full_name, role FROM public.profiles WHERE email = 'john@example.com';
```

**Step 3: Click Run**
- You should see the user's role changed to 'admin'

**Result**: User is now an admin!

---

### Method 3: Using Supabase Dashboard (Manual)

**Step 1: Open Supabase Dashboard**
1. Go to your Supabase project
2. Click **Database** (left sidebar)
3. Click **Tables**
4. Click **profiles** table

**Step 2: Find the User**
1. Look for the user by email
2. Click on their row to edit

**Step 3: Change Role**
1. Find the "role" column
2. Change value from "customer" or "braider" to "admin"
3. Click Save

**Result**: User is now an admin!

---

## 📋 Quick Reference

### SQL to Make User Admin
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = '[USER_EMAIL]';
```

### SQL to Check Admin Status
```sql
SELECT email, full_name, role FROM public.profiles WHERE role = 'admin';
```

### SQL to Remove Admin Role
```sql
UPDATE public.profiles
SET role = 'customer'
WHERE email = '[USER_EMAIL]';
```

### SQL to List All Users with Roles
```sql
SELECT email, full_name, role FROM public.profiles ORDER BY role DESC;
```

---

## 🔍 Verify Admin Access

After making a user admin, they should be able to:

1. **Access Admin Dashboard**
   - Go to `/admin`
   - Should see admin dashboard

2. **View All Users**
   - Go to `/admin/users`
   - Should see all users with real names

3. **Manage Braider Verification**
   - Go to `/admin/verification`
   - Should see verification requests

4. **View Payments**
   - Go to `/admin/payments`
   - Should see all payments

5. **View Disputes**
   - Go to `/admin/disputes`
   - Should see all disputes

6. **View Conversations**
   - Go to `/admin/conversations`
   - Should see all conversations

7. **View Financials**
   - Go to `/admin/financials`
   - Should see financial reports

---

## ⚠️ Important Notes

### Admin Roles
- **customer**: Regular customer (can book braiders)
- **braider**: Braider (can offer services)
- **admin**: Administrator (can manage everything)

### First Admin
If you don't have any admins yet:
1. Use Supabase SQL to make your first user admin
2. Then use the admin dashboard to manage others

### Multiple Admins
You can have multiple admins. Each admin can:
- View all users
- Manage braider verification
- Handle disputes
- View payments
- Manage conversations

---

## 🚀 Step-by-Step Example

### Make john@example.com an Admin

**Using SQL:**
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'john@example.com';
```

**Verify:**
```sql
SELECT email, full_name, role FROM public.profiles WHERE email = 'john@example.com';
```

**Expected Result:**
```
email                | full_name    | role
---------------------|--------------|-------
john@example.com     | John Smith   | admin
```

---

## 📊 Admin Capabilities

Once a user is an admin, they can:

| Feature | Access |
|---------|--------|
| View all users | ✅ Yes |
| Search users by name/email | ✅ Yes |
| Filter users by role | ✅ Yes |
| Verify braiders | ✅ Yes |
| View all bookings | ✅ Yes |
| View all payments | ✅ Yes |
| Handle disputes | ✅ Yes |
| View conversations | ✅ Yes |
| View financial reports | ✅ Yes |
| Manage other admins | ✅ Yes |

---

## 🔐 Security Notes

- Only make trusted users admins
- Admins have full access to all data
- Admins can see all user information
- Admins can manage braider verification
- Admins can handle disputes and refunds

---

## ✅ Troubleshooting

### User Can't Access Admin Panel
1. Verify role is set to 'admin' in database
2. Have user logout and login again
3. Check browser cache (clear it)
4. Verify user's auth token is valid

### User Still Sees "Access Denied"
1. Check that role is 'admin' (not 'Admin' or other case)
2. Verify user is logged in
3. Check that user's profile exists in profiles table
4. Try refreshing the page

### Can't Find User in Admin Users Page
1. Use search box to find by email
2. Check that user has a profile in profiles table
3. Verify user's email is correct
4. Run SQL to check if user exists

---

## 📞 Quick Commands

### Make User Admin (SQL)
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = '[EMAIL]';
```

### Remove Admin Role (SQL)
```sql
UPDATE public.profiles SET role = 'customer' WHERE email = '[EMAIL]';
```

### List All Admins (SQL)
```sql
SELECT email, full_name FROM public.profiles WHERE role = 'admin';
```

### List All Users (SQL)
```sql
SELECT email, full_name, role FROM public.profiles ORDER BY created_at DESC;
```

---

## ✨ Summary

**To make a user admin:**

1. **Easiest**: Use Admin Users Page (`/admin/users`)
2. **Direct**: Use Supabase SQL Editor
3. **Manual**: Edit profiles table in Supabase Dashboard

**All three methods work. Choose whichever is easiest for you!**

