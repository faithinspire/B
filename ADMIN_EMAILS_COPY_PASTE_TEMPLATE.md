# Admin Emails - Copy & Paste Template

## How to Use This Template

1. **Replace the 3 email addresses** below with your actual admin emails
2. **Copy the entire SQL block** (the UPDATE statement)
3. **Paste it into** `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` replacing the existing UPDATE statement
4. **Run the SQL** in Supabase

---

## Template - Edit Your Emails Here

Replace these three emails with your actual admin emails:

```
Email 1: ___________________________
Email 2: ___________________________
Email 3: ___________________________
```

---

## SQL to Paste

Copy this entire block and paste into `COMPLETE_FIX_EMAILS_AND_ADMINS.sql`:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'EMAIL_1_HERE',
  'EMAIL_2_HERE', 
  'EMAIL_3_HERE'
);
```

---

## Example (Already Filled In)

If your 3 admin emails are:
- damilola@gmail.com
- admin@braidme.com
- support@braidme.com

Then paste this:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'damilola@gmail.com',
  'admin@braidme.com', 
  'support@braidme.com'
);
```

---

## Step-by-Step

### Step 1: Write Down Your 3 Emails
```
1. _________________________________
2. _________________________________
3. _________________________________
```

### Step 2: Fill in the SQL Template
Replace `EMAIL_1_HERE`, `EMAIL_2_HERE`, `EMAIL_3_HERE` with your emails

### Step 3: Copy the SQL Block
Select all the SQL code and copy it

### Step 4: Open COMPLETE_FIX_EMAILS_AND_ADMINS.sql
Find the UPDATE statement (around line 30-40)

### Step 5: Replace the Old UPDATE Statement
Delete the old one with placeholder emails, paste your new one

### Step 6: Run in Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. SQL Editor → New Query
4. Paste entire file
5. Click Run

### Step 7: Verify
You should see your 3 emails listed with `role = 'admin'` ✅

---

## Common Mistakes to Avoid

❌ **Wrong**: Missing quotes around emails
```sql
WHERE email IN (
  damilola@gmail.com,  -- ❌ Missing quotes!
  admin@braidme.com,
  support@braidme.com
);
```

✅ **Right**: Quotes around each email
```sql
WHERE email IN (
  'damilola@gmail.com',  -- ✅ Has quotes
  'admin@braidme.com',
  'support@braidme.com'
);
```

❌ **Wrong**: Typos in email addresses
```sql
WHERE email IN (
  'damilola@gmial.com',  -- ❌ Typo: gmial instead of gmail
  'admin@braidme.com',
  'support@braidme.com'
);
```

✅ **Right**: Exact email addresses
```sql
WHERE email IN (
  'damilola@gmail.com',  -- ✅ Correct spelling
  'admin@braidme.com',
  'support@braidme.com'
);
```

---

## Need Help?

- **Can't find the UPDATE statement?** → See `ADMIN_EMAIL_SETUP_GUIDE.md`
- **Don't know how to run SQL?** → See `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` (has instructions)
- **Emails not working?** → See `RESEND_DOMAIN_VERIFICATION_GUIDE.md`
