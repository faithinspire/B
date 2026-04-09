# 📊 VIEW & EDIT USERS DIRECTLY IN SUPABASE DATABASE

## 🎯 HOW TO SEE USER NAMES AND EMAILS IN THE TABLE

### Step 1: Go to Supabase Table Editor

**URL**: https://app.supabase.com → Your Project → Table Editor

---

### Step 2: Click on "profiles" Table

**Left sidebar** → Click "profiles"

**You should see columns**:
- id
- email
- full_name
- role
- created_at
- updated_at
- phone
- avatar_url
- etc.

---

### Step 3: View All Users

**The table should now show**:

```
id (UUID)              | email              | full_name      | role     | created_at
---------------------- | ------------------ | -------------- | -------- | ----------
550e8400-e29b-41d4... | john@example.com   | John Doe       | customer | 2024-01-15
550e8400-e29b-41d4... | jane@example.com   | Jane Smith     | braider  | 2024-01-16
550e8400-e29b-41d4... | admin@example.com  | Admin User     | admin    | 2024-01-14
```

---

## 🔧 HOW TO MAKE A USER ADMIN

### Method 1: Edit in Table Editor (Easiest)

1. **Find the user** you want to make admin
2. **Click on the "role" cell** for that user
3. **Change value** from "customer" or "braider" to "admin"
4. **Press Enter** to save
5. **Done!** User is now admin ✅

---

### Method 2: Use SQL Query (Alternative)

**Go to**: SQL Editor → New Query

**Paste this** (replace with actual email):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'user@example.com';
```

**Click "Run"**

---

## ✅ WHAT YOU'LL SEE

### Before (Data Not Visible)
```
id (UUID)              | email | full_name | role
---------------------- | ----- | --------- | ----
550e8400-e29b-41d4... |       |           |
550e8400-e29b-41d4... |       |           |
```

### After (Data Visible)
```
id (UUID)              | email              | full_name      | role
---------------------- | ------------------ | -------------- | --------
550e8400-e29b-41d4... | john@example.com   | John Doe       | customer
550e8400-e29b-41d4... | jane@example.com   | Jane Smith     | braider
550e8400-e29b-41d4... | admin@example.com  | Admin User     | admin
```

---

## 🚀 STEP-BY-STEP TO MAKE SOMEONE ADMIN

### Step 1: Open Supabase
- Go to: https://app.supabase.com
- Select your project

### Step 2: Go to Table Editor
- Left sidebar → "Table Editor"

### Step 3: Click "profiles" Table
- You'll see all users with their data

### Step 4: Find the User
- Look for the user's email in the "email" column
- Or look for their name in the "full_name" column

### Step 5: Edit the Role
- Click on the "role" cell for that user
- A dropdown or text field appears
- Change it to "admin"
- Press Enter

### Step 6: Confirm
- The row updates
- User is now admin ✅

---

## 📋 EXAMPLE

**Before**:
```
Email: john@example.com
Name: John Doe
Role: customer  ← Click here
```

**After clicking**:
```
Email: john@example.com
Name: John Doe
Role: [dropdown showing: customer, braider, admin]
      ↓ Select "admin"
```

**After saving**:
```
Email: john@example.com
Name: John Doe
Role: admin ✅
```

---

## 🆘 TROUBLESHOOTING

**Can't see email/name columns?**
- Scroll right in the table
- Columns might be hidden
- Click column header to show/hide

**Can't edit the role?**
- Make sure RLS is disabled (it should be)
- Try refreshing the page
- Try using SQL query instead

**Changes not saving?**
- Check for error message
- Try again
- Use SQL query as backup

**Still can't see data?**
- Run the SQL fix again:
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
UPDATE public.profiles p
SET email = COALESCE(p.email, au.email),
    full_name = COALESCE(p.full_name, au.email)
FROM auth.users au
WHERE p.id = au.id;
```

---

## ✨ THAT'S IT!

You can now:
- ✅ See all user names and emails in the database
- ✅ See all user roles
- ✅ Edit roles directly in the table
- ✅ Make any user an admin with one click

**Go to Supabase now and check the profiles table!** 🎉
