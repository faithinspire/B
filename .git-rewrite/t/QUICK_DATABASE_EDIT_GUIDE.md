# ⚡ QUICK DATABASE EDIT GUIDE

## 🎯 SEE USER DATA IN DATABASE TABLE

### 1️⃣ GO TO SUPABASE
**URL**: https://app.supabase.com → Your Project

### 2️⃣ CLICK TABLE EDITOR
**Left sidebar** → "Table Editor"

### 3️⃣ CLICK "profiles" TABLE
**You'll see**:
- id (UUID)
- email ← User emails here
- full_name ← User names here
- role ← User roles here
- created_at
- updated_at

---

## 🔧 MAKE SOMEONE ADMIN

### Step 1: Find the User
Look for their email or name in the table

### Step 2: Click the "role" Cell
For that user, click on the role column

### Step 3: Change to "admin"
- Select "admin" from dropdown
- Or type "admin"

### Step 4: Press Enter
Done! User is now admin ✅

---

## 📊 WHAT YOU'LL SEE

```
Email              | Name        | Role
------------------ | ----------- | ---------
john@example.com   | John Doe    | customer ← Click here
jane@example.com   | Jane Smith  | braider
admin@example.com  | Admin User  | admin
```

**Click on "customer" → Change to "admin" → Press Enter**

---

## ✅ DONE!

User is now admin in the database.

**Go to Supabase now!** 🚀
