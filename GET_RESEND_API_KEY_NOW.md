# 🚀 GET RESEND API KEY - STEP BY STEP

## The password reset emails are ready to work. You just need a Resend API key.

---

## STEP 1: Go to Resend Website

Open this link in your browser:
```
https://resend.com
```

---

## STEP 2: Sign Up (FREE)

1. Click "Sign Up" button
2. Enter your email address
3. Create a password
4. Click "Sign Up"
5. Verify your email (check inbox)

**Cost: FREE** ✅

---

## STEP 3: Create API Key

1. After signing up, go to dashboard
2. Click "API Keys" in left sidebar
3. Click "Create API Key" button
4. Give it a name: `BraidMe Password Reset`
5. Click "Create"
6. **Copy the API key** (starts with `re_`)

**Example key format:**
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## STEP 4: Update `.env.local`

Open `.env.local` file in your project and find this line:

```env
RESEND_API_KEY=re_your_resend_api_key_here
```

Replace it with your actual key:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Save the file.**

---

## STEP 5: Run Database Migration

1. Open Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to "SQL Editor" (left sidebar)
4. Click "New Query"
5. Copy and paste this SQL:

```sql
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

GRANT ALL ON password_reset_tokens TO authenticated;
GRANT ALL ON password_reset_tokens TO service_role;
```

6. Click "Run" button
7. Wait for success message

---

## STEP 6: Test Email Service

Open terminal and run:

```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

Replace `your-email@example.com` with your actual email.

**Expected response:**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "result": {
    "id": "...",
    "from": "noreply@braidme.com",
    "to": "your-email@example.com",
    "subject": "BraidMe Email Service Test"
  }
}
```

**Check your email inbox** - you should receive a test email! ✅

---

## STEP 7: Test Complete Password Reset Flow

### 7a. Request Password Reset

1. Go to http://localhost:3000/forgot-password
2. Enter your email address
3. Click "Send Reset Link"
4. You should see: "If an account exists with this email, a password reset link has been sent."

### 7b. Check Email

1. Go to your email inbox
2. Look for email from `noreply@braidme.com`
3. Subject: "Reset Your BraidMe Password"
4. Click the reset link

### 7c. Reset Password

1. You'll be redirected to `/reset-password?token=...&email=...`
2. Enter your new password (min 8 characters)
3. Confirm password
4. Click "Reset Password"
5. You should see: "Password reset successful!"
6. You'll be redirected to login page

### 7d. Login with New Password

1. Go to http://localhost:3000/login
2. Enter your email
3. Enter your new password
4. Click "Sign In"
5. You should be logged in ✅

---

## STEP 8: Deploy to Production

```bash
# Commit changes
git add .
git commit -m "Fix: Implement working password reset email system"

# Push to main
git push origin main
```

Vercel will automatically deploy.

### Add Environment Variables to Vercel

1. Go to Vercel dashboard: https://vercel.com
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add these variables:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
RESEND_FROM_EMAIL=noreply@braidme.com
```

5. Click "Save"
6. Redeploy project

---

## ✅ CHECKLIST

- [ ] Signed up for Resend (https://resend.com)
- [ ] Created API key
- [ ] Copied API key
- [ ] Updated `.env.local` with API key
- [ ] Ran database migration in Supabase
- [ ] Tested email service with `/api/auth/test-email`
- [ ] Received test email in inbox
- [ ] Tested complete password reset flow
- [ ] Deployed to production
- [ ] Added env vars to Vercel

---

## 🎉 DONE!

Your password reset email system is now **fully working**! 

Users can now:
1. Request password reset
2. Receive email with reset link
3. Click link and set new password
4. Login with new password

---

## TROUBLESHOOTING

### Email Not Received?

1. **Check Resend API Key**
   - Verify it's not the placeholder
   - Verify it starts with `re_`
   - Verify it's in `.env.local` (not `.env.example`)

2. **Check Spam Folder**
   - Email might be in spam
   - Add `noreply@braidme.com` to contacts

3. **Check Resend Dashboard**
   - Go to https://resend.com/dashboard
   - Click "Emails" section
   - Look for your test email
   - Check if it shows "Delivered" or "Failed"

4. **Restart Development Server**
   - Stop `npm run dev`
   - Start it again
   - Try sending email again

### Token Verification Failed?

1. **Check Database Migration**
   - Go to Supabase SQL Editor
   - Run: `SELECT * FROM password_reset_tokens;`
   - Should return empty table (0 rows)

2. **Check Token Expiration**
   - Tokens expire after 24 hours
   - Try requesting a new reset link

3. **Check Email Match**
   - Email in URL must match email in database
   - Email is case-sensitive

### Password Update Failed?

1. **Check User Exists**
   - Go to Supabase Auth section
   - Verify user account exists

2. **Check Service Role Key**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
   - Verify it's the correct key from Supabase dashboard

3. **Check Password Requirements**
   - Password must be at least 8 characters
   - No other requirements

---

## NEED HELP?

1. Check `PASSWORD_RESET_EMAIL_SETUP.md` for complete documentation
2. Check `VERIFY_PASSWORD_RESET_SETUP.md` for verification steps
3. Check server logs for error messages
4. Check Resend dashboard for email delivery logs

---

## SUMMARY

**What you need to do:**
1. Get Resend API key (FREE)
2. Update `.env.local`
3. Run database migration
4. Test email service
5. Deploy to production

**Time required:** ~10 minutes

**Result:** Working password reset emails ✅
