# 🚀 Setup Password Reset System - DO THIS NOW

## ⏱️ Time Required: 10 minutes

---

## STEP 1: Run SQL Migration (5 minutes)

### Open Supabase
1. Go to: **https://app.supabase.com/**
2. Login with your credentials
3. Select project: **BRAID2**

### Create New Query
4. Click **SQL Editor** (left sidebar)
5. Click **New Query** (top right)

### Copy & Paste SQL
6. Copy this entire SQL block:

```sql
-- Create password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, token_hash)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Disable RLS for this table
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;
```

7. Paste into the SQL Editor
8. Click **Run** (or press Ctrl+Enter)

### Verify Success
9. You should see: ✅ **"Success. No rows returned"**
10. ✅ **STEP 1 COMPLETE**

---

## STEP 2: Verify Resend Domain (5 minutes)

### Open Resend Dashboard
1. Go to: **https://resend.com/domains**
2. Login with your credentials

### Add Domain
3. Click **Add Domain** (top right)
4. Enter domain: **braidme.com**
5. Click **Add**

### Add DNS Records
6. You'll see DNS records to add:
   - Usually 2-3 records (CNAME, TXT, etc.)
   - Copy each record

7. Go to your domain registrar (GoDaddy, Namecheap, etc.)
8. Find DNS settings
9. Add each DNS record from Resend
10. Save changes

### Wait for Verification
11. Go back to Resend
12. Wait for verification (usually 1-2 minutes)
13. You'll see: ✅ **Green checkmark** next to domain
14. ✅ **STEP 2 COMPLETE**

---

## STEP 3: Test Password Reset (5 minutes)

### Start Testing
1. Go to: **http://localhost:3001/login**
2. Click **"Forgot Password"** button
3. Enter your email address
4. Click **"Send Reset Link"**

### Check Email
5. Open your email inbox
6. Look for email from: **noreply@braidme.com**
7. Subject: **"Reset Your BraidMe Password"**
8. Click the **"Reset Password"** button in email

### Set New Password
9. You'll be taken to reset page
10. Enter new password
11. Confirm password
12. Click **"Update Password"**

### Verify Login
13. Go back to login page
14. Enter your email
15. Enter your NEW password
16. Click **"Login"**
17. ✅ **YOU'RE IN!**

---

## ✅ Checklist

- [ ] Opened Supabase
- [ ] Created new SQL query
- [ ] Copied and pasted SQL
- [ ] Clicked Run
- [ ] Saw success message
- [ ] Opened Resend domains
- [ ] Added braidme.com domain
- [ ] Added DNS records to registrar
- [ ] Waited for verification
- [ ] Saw green checkmark
- [ ] Tested password reset flow
- [ ] Received email
- [ ] Clicked reset link
- [ ] Set new password
- [ ] Logged in with new password
- [ ] ✅ SYSTEM WORKING!

---

## 🆘 Troubleshooting

### SQL Error: "Table already exists"
**Solution**: This is fine! The `IF NOT EXISTS` clause handles it. Just means table was already created.

### SQL Error: "Permission denied"
**Solution**: Make sure you're using the correct Supabase project (BRAID2)

### Resend: "Domain not verified"
**Solution**: 
- Make sure DNS records are added to your registrar
- Wait 5-10 minutes for DNS to propagate
- Try refreshing the page

### Email not received
**Solution**:
- Check spam/promotions folder
- Make sure Resend domain shows green checkmark
- Try with a different email address
- Check browser console for errors

### Reset link doesn't work
**Solution**:
- Make sure link hasn't expired (24 hours)
- Try copying the link from email and pasting in browser
- Check that you're using correct email

---

## 📞 Need Help?

If something doesn't work:
1. Check the troubleshooting section above
2. Review `PASSWORD_RESET_SYSTEM_DEPLOYMENT_GUIDE.md` for detailed info
3. Check browser console for error messages
4. Check server logs for API errors

---

## 🎉 Success!

Once all steps are complete:
- ✅ Users can reset passwords via email
- ✅ Recovery links are generated correctly
- ✅ Emails are sent from braidme.com
- ✅ System is production-ready

---

**Total Time**: ~10 minutes
**Difficulty**: Easy (mostly copy-paste)
**Status**: Ready to go!

