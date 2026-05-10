# Admin Email Setup Guide

## Quick Setup - 3 Steps

### Step 1: Open the SQL File
Open `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` in your editor.

### Step 2: Find the Email Section
Look for this section (around line 30-40):

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'your-email-1@gmail.com',
  'your-email-2@gmail.com', 
  'your-email-3@gmail.com'
);
```

### Step 3: Replace with Your Emails
Replace the three placeholder emails with your actual admin emails:

**BEFORE:**
```sql
WHERE email IN (
  'your-email-1@gmail.com',
  'your-email-2@gmail.com', 
  'your-email-3@gmail.com'
);
```

**AFTER (Example):**
```sql
WHERE email IN (
  'damilola@gmail.com',
  'admin@braidme.com', 
  'support@braidme.com'
);
```

### Step 4: Run in Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the entire `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` file
6. Paste it into the SQL editor
7. Click **Run**

### Step 5: Verify Success
At the bottom of the SQL editor, you should see:
- ✅ `password_reset_tokens table created`
- ✅ A list of your 3 admin emails with `role = 'admin'`

## What This Does

1. **Creates password_reset_tokens table** - Stores password reset tokens with proper schema
2. **Makes 3 users admin** - Sets their role to 'admin' so they can access the admin dashboard
3. **Disables RLS** - Allows the API to access these tables without permission issues

## Next Steps

After running the SQL:

1. **Verify Resend Domain** (5 minutes)
   - Go to https://resend.com/domains
   - Add domain: `braidme.com`
   - Follow DNS verification steps
   - Once verified, emails will send successfully

2. **Test Password Reset**
   - Go to http://localhost:3001/login
   - Click "Forgot Password"
   - Enter an email
   - Check inbox for reset email from `noreply@braidme.com`
   - Click the reset link
   - Verify password reset works

3. **Test Admin Access**
   - Log in with one of your 3 admin emails
   - Go to http://localhost:3001/admin
   - Verify you can access the admin dashboard

## Troubleshooting

**Q: I don't see the admin emails in the results**
- Make sure the emails exactly match emails in your `profiles` table
- Check that the emails are spelled correctly (case-insensitive, but must match)

**Q: Still not receiving emails**
- Verify Resend domain is verified at https://resend.com/domains
- Check spam/junk folder
- Verify `RESEND_API_KEY` is correct in `.env.local`

**Q: Can't access admin dashboard**
- Make sure you logged in with one of the 3 admin emails
- Refresh the page
- Check browser console for errors

## Questions?

If you need help, check:
- `RESEND_DOMAIN_VERIFICATION_GUIDE.md` - Domain verification steps
- `PASSWORD_RESET_TESTING_GUIDE.md` - Testing the password reset flow
- `MAKE_ADMINS_WORKING_SOLUTION.md` - More admin setup details
