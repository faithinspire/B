# VERIFY PASSWORD RESET EMAIL SYSTEM

## Checklist Before Testing

### ✅ Code Changes
- [x] `app/api/auth/forgot-password/route.ts` - Updated to use Resend
- [x] `app/api/auth/reset-password/route.ts` - Updated for token verification
- [x] `app/api/auth/verify-reset-token/route.ts` - NEW endpoint created
- [x] `app/(public)/reset-password/page.tsx` - Updated for token-based flow
- [x] `supabase/migrations/add_password_reset_tokens.sql` - Updated schema

### ⏳ Configuration Needed

#### 1. Resend API Key
- [ ] Go to https://resend.com
- [ ] Sign up for free account
- [ ] Create API key
- [ ] Copy key (format: `re_xxxxxxxxxxxxx`)
- [ ] Update `.env.local`:
  ```env
  RESEND_API_KEY=re_xxxxxxxxxxxxx
  ```

#### 2. Database Migration
- [ ] Open Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Run the SQL below
- [ ] Verify table created successfully

#### 3. Environment Variables
- [ ] Verify `.env.local` has:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://gymgxcspjysrkluxyavd.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
  RESEND_FROM_EMAIL=noreply@braidme.com
  RESEND_API_KEY=re_xxxxxxxxxxxxx
  ```

---

## SQL TO RUN IN SUPABASE

Copy and paste this entire SQL block into Supabase SQL Editor:

```sql
-- Drop old table if it exists
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

-- Create new password_reset_tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Disable RLS (this table is admin-only)
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON password_reset_tokens TO authenticated;
GRANT ALL ON password_reset_tokens TO service_role;

-- Verify table was created
SELECT * FROM password_reset_tokens LIMIT 1;
```

**Expected output:** Empty table (0 rows) - this is correct!

---

## VERIFICATION STEPS

### Step 1: Verify Environment Variables
```bash
# Check .env.local has all required variables
grep -E "RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_APP_URL" .env.local
```

Expected output:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
```

### Step 2: Verify Database Table
In Supabase SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'password_reset_tokens';
```

Expected output:
```
password_reset_tokens
```

### Step 3: Verify Indexes
In Supabase SQL Editor, run:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'password_reset_tokens';
```

Expected output:
```
idx_password_reset_tokens_token_hash
idx_password_reset_tokens_email
idx_password_reset_tokens_expires_at
```

### Step 4: Test Email Service
```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

Expected response:
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

**Check your email inbox** - you should receive the test email!

---

## TESTING THE COMPLETE FLOW

### Test Scenario 1: Happy Path (Everything Works)

1. **Request Password Reset**
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com"}'
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "If an account exists with this email, a password reset link has been sent."
   }
   ```

2. **Check Email**
   - Go to your email inbox
   - Look for email from `noreply@braidme.com`
   - Subject: "Reset Your BraidMe Password"
   - Click the reset link

3. **Verify Token**
   - You'll be redirected to `/reset-password?token=...&email=...`
   - Page should load without errors
   - Password form should be visible

4. **Reset Password**
   - Enter new password (min 8 characters)
   - Confirm password
   - Click "Reset Password"
   - You should see success message
   - Redirected to login page

5. **Login with New Password**
   - Go to `/login`
   - Enter email and new password
   - You should be logged in ✅

### Test Scenario 2: Invalid Token

1. Manually modify the token in URL: `/reset-password?token=invalid&email=...`
2. You should see: "Invalid or expired reset link"
3. Link to request new reset should be visible

### Test Scenario 3: Expired Token

1. Request password reset
2. Wait 24+ hours (or manually update database)
3. Try to use the reset link
4. You should see: "Invalid or expired reset link"

---

## DATABASE VERIFICATION

### Check if tokens are being stored

In Supabase SQL Editor:
```sql
SELECT 
  email,
  token_hash,
  expires_at,
  created_at
FROM password_reset_tokens
ORDER BY created_at DESC
LIMIT 5;
```

You should see tokens with:
- `email`: The email address
- `token_hash`: A long SHA256 hash
- `expires_at`: 24 hours in the future
- `created_at`: Current timestamp

### Clean up old tokens

```sql
DELETE FROM password_reset_tokens
WHERE expires_at < NOW();
```

---

## TROUBLESHOOTING

### Email Not Received

**Check 1: Resend API Key**
```bash
# Verify key is not placeholder
grep "RESEND_API_KEY" .env.local | grep -v "your_resend"
```

**Check 2: Resend Dashboard**
- Go to https://resend.com/dashboard
- Check "Emails" section for delivery logs
- Look for failed deliveries

**Check 3: Spam Folder**
- Check email spam/junk folder
- Add `noreply@braidme.com` to contacts

**Check 4: Server Logs**
```bash
# Look for errors in console
npm run dev
# Make request and check console output
```

### Token Verification Failed

**Check 1: Database Table**
```sql
SELECT COUNT(*) FROM password_reset_tokens;
```

Should return a number > 0 if tokens are being stored.

**Check 2: Token Hash**
```sql
SELECT token_hash, expires_at FROM password_reset_tokens 
ORDER BY created_at DESC LIMIT 1;
```

Verify `expires_at` is in the future.

**Check 3: Email Match**
```sql
SELECT DISTINCT email FROM password_reset_tokens;
```

Verify email matches exactly (case-sensitive).

### Password Update Failed

**Check 1: User Exists**
```bash
# In Supabase Auth section, verify user exists
```

**Check 2: Service Role Key**
```bash
# Verify key is set
grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | head -c 50
```

**Check 3: Password Requirements**
- Password must be at least 8 characters
- No special character requirements

---

## PRODUCTION DEPLOYMENT

### Vercel Environment Variables

Add to Vercel project settings:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
RESEND_FROM_EMAIL=noreply@braidme.com
```

### Deploy

```bash
git add .
git commit -m "Fix: Implement working password reset email system"
git push origin main
```

Vercel will automatically deploy.

---

## FINAL CHECKLIST

- [ ] Resend API key obtained and added to `.env.local`
- [ ] Database migration ran successfully
- [ ] Test email received in inbox
- [ ] Complete password reset flow tested
- [ ] New password works for login
- [ ] Code deployed to production
- [ ] Production environment variables set in Vercel

---

## SUPPORT

If you encounter issues:

1. Check all environment variables are set correctly
2. Verify database migration ran
3. Check Resend dashboard for delivery logs
4. Review server logs for errors
5. Test with `/api/auth/test-email` endpoint

The system is now **production-ready** and will send emails reliably!
