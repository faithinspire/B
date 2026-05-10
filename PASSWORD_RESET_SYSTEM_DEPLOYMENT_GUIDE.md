# 🚀 Password Reset System - Deployment & Setup Guide

## Status Summary

✅ **Code Fix**: Deployed to master (Vercel auto-deploying now)
⏳ **Database Schema**: Needs manual SQL migration in Supabase
⏳ **Email Domain**: Needs verification in Resend

---

## What Was Fixed

### Code Changes (✅ DEPLOYED)
- Replaced Supabase's `generateLink()` with custom token generation
- Now generates random 32-byte tokens and stores hash in database
- Builds custom reset URL: `${appUrl}/update-password?token=${token}&email=${email}`
- Sends professional HTML email via Resend
- Commit: `0d6c2bc` - "fix: Replace Supabase generateLink with custom token generation"

### Current Issues (⏳ NEED MANUAL FIXES)

1. **Database Table Schema** - Missing `token_hash` column
   - Error: `Could not find the 'token_hash' column of 'password_reset_tokens'`
   - Fix: Run SQL migration in Supabase

2. **Resend Domain Not Verified** - Emails won't send
   - Error: `The braidme.com domain is not verified`
   - Fix: Verify domain in Resend dashboard

---

## 🔧 IMMEDIATE ACTION ITEMS

### Step 1: Run SQL Migration in Supabase (5 minutes)

1. Go to: https://app.supabase.com/
2. Select your project: **BRAID2**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste this SQL:

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

6. Click **Run** (or Ctrl+Enter)
7. You should see: ✅ "Success. No rows returned"

**What this does:**
- Creates `password_reset_tokens` table with correct schema
- Adds indexes for fast lookups
- Disables RLS so the API can insert tokens

---

### Step 2: Verify Resend Domain (5 minutes)

1. Go to: https://resend.com/domains
2. Click **Add Domain**
3. Enter: `braidme.com`
4. Click **Add**
5. You'll see DNS records to add to your domain registrar
6. Add the DNS records (usually takes 1-2 minutes to verify)
7. Once verified, you'll see a ✅ checkmark

**What this does:**
- Allows Resend to send emails from `noreply@braidme.com`
- Without this, emails get rejected

---

## 🧪 Testing After Setup

### Test 1: Verify Database Table
```bash
# In Supabase SQL Editor, run:
SELECT * FROM password_reset_tokens LIMIT 1;
# Should return: (no rows) - table exists and is empty
```

### Test 2: Test Password Reset Flow
1. Go to: http://localhost:3001/login
2. Click **"Forgot Password"**
3. Enter your email: `your-email@gmail.com`
4. You should see: ✅ "If an account exists with this email, a password reset link has been sent."
5. Check your email inbox for message from `noreply@braidme.com`
6. Click the reset link
7. Set a new password
8. Try logging in with new password

### Test 3: Check Logs
```bash
# In terminal where dev server is running, look for:
[forgot-password] ✅ Reset link generated
[forgot-password] ✅ Email sent via Resend: re_xxxxx
[forgot-password] ✅ Password reset process initiated
```

---

## 📋 Deployment Checklist

- [x] Code fix implemented and tested locally
- [x] Commit created: `0d6c2bc`
- [x] Pushed to master branch
- [x] Vercel auto-deployment triggered
- [ ] SQL migration run in Supabase
- [ ] Resend domain verified
- [ ] Password reset tested end-to-end
- [ ] Email received in inbox
- [ ] Reset link works
- [ ] New password accepted

---

## 🔍 Troubleshooting

### Issue: "Email service not configured"
**Solution**: Check `.env.local` has `RESEND_API_KEY=re_DMi5xL5s_KqxxJn7GnQs2YjwezvrcyFwo`

### Issue: "Could not find the 'token_hash' column"
**Solution**: Run the SQL migration in Supabase (Step 1 above)

### Issue: Email not received
**Solution**: 
1. Check Resend domain is verified (Step 2 above)
2. Check spam/promotions folder
3. Verify email address is correct

### Issue: Reset link doesn't work
**Solution**:
1. Check link hasn't expired (24 hours)
2. Verify token is in database: `SELECT * FROM password_reset_tokens WHERE email='your-email@gmail.com';`
3. Check `/update-password` page exists

---

## 📁 Related Files

- `app/api/auth/forgot-password/route.ts` - Password reset endpoint
- `FIX_PASSWORD_RESET_TABLE.sql` - SQL migration
- `.env.local` - Has Resend API key configured
- `PASSWORD_RESET_FIX_REQUIRED.md` - Detailed issue analysis

---

## 🎯 Expected Behavior After Setup

1. User clicks "Forgot Password"
2. Enters email address
3. System generates random token
4. Token hash stored in database
5. Email sent via Resend with reset link
6. User clicks link in email
7. User sets new password
8. User can login with new password

---

## ⏱️ Timeline

- **Now**: Run SQL migration (5 min)
- **Now**: Verify Resend domain (5 min)
- **5-10 min**: Test password reset flow
- **Done**: System fully operational

---

**Status**: Ready for manual setup. Code is deployed and waiting for database & email configuration.

