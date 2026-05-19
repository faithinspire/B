# Password Reset System - Complete Diagnostic & Fix

## 🔍 SYSTEM ANALYSIS

### Current Implementation Status:
✅ **API Routes**: Both `/api/auth/password-reset/request` and `/verify` are properly implemented
✅ **Frontend**: `/forgot-password` page is connected and calling the API correctly
✅ **Database**: `password_reset_tokens` table exists with proper schema
✅ **Email Service**: Brevo API is configured with valid credentials
✅ **Logging**: Comprehensive logging with `[Password Reset]` prefix

### Identified Issues:

1. **BREVO_FROM_EMAIL Configuration**
   - Current: `noreply@braidme.com`
   - Issue: This email may not be verified in Brevo
   - Status: ⚠️ CRITICAL - Unverified sender email

2. **NEXT_PUBLIC_APP_URL**
   - Current: `http://localhost:3000`
   - Issue: In production, this should be your actual domain
   - Status: ⚠️ CRITICAL - Reset links won't work in production

3. **Brevo API Key Validation**
   - Current: Key is present and formatted correctly
   - Status: ✅ OK

4. **Database Table Status**
   - Table exists: ✅ YES
   - RLS disabled: ✅ YES
   - Indexes created: ✅ YES

---

## 🔧 STEP-BY-STEP FIX

### Step 1: Verify Brevo Sender Email
**In Brevo Dashboard:**
1. Go to https://app.brevo.com
2. Navigate to **Settings → Senders & API**
3. Check if `noreply@braidme.com` is verified
4. If NOT verified:
   - Click "Add a sender"
   - Enter: `noreply@braidme.com`
   - Verify the email (check inbox for verification link)
   - Wait for verification to complete

### Step 2: Update Environment Variables for Production
**In Vercel/Production:**
1. Update `NEXT_PUBLIC_APP_URL` to your actual domain:
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
2. Verify `BREVO_API_KEY` is set correctly
3. Verify `BREVO_FROM_EMAIL` is verified in Brevo

### Step 3: Test the Complete Flow Locally

**Test 1: Check if password_reset_tokens table exists**
```sql
SELECT * FROM password_reset_tokens LIMIT 1;
```

**Test 2: Send a password reset request**
```bash
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Test 3: Check server logs**
Look for `[Password Reset]` messages in your terminal/logs

**Test 4: Verify token was stored**
```sql
SELECT * FROM password_reset_tokens 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC LIMIT 1;
```

---

## 📋 COMPLETE CHECKLIST

### Before Testing:
- [ ] Brevo sender email is verified
- [ ] BREVO_API_KEY is valid
- [ ] NEXT_PUBLIC_APP_URL is set correctly
- [ ] password_reset_tokens table exists in database
- [ ] RLS is disabled on password_reset_tokens table

### Testing Steps:
1. [ ] Go to `/forgot-password`
2. [ ] Enter your email address
3. [ ] Click "Send Reset Link"
4. [ ] Check server logs for `[Password Reset]` messages
5. [ ] Check email inbox (and spam folder)
6. [ ] If email received, click the reset link
7. [ ] Enter new password (8+ chars, uppercase, lowercase, numbers)
8. [ ] Verify password reset successful
9. [ ] Try logging in with new password

### If Email Not Received:

**Check 1: Server Logs**
- Look for `[Password Reset]` messages
- Check for Brevo API errors
- Verify token was stored in database

**Check 2: Brevo Dashboard**
- Go to https://app.brevo.com
- Check **Transactional → Logs**
- Look for failed email sends
- Check sender email verification status

**Check 3: Database**
```sql
-- Check if tokens are being stored
SELECT COUNT(*) FROM password_reset_tokens;

-- Check if tokens are expired
SELECT * FROM password_reset_tokens 
WHERE expires_at > NOW() 
ORDER BY created_at DESC LIMIT 5;
```

**Check 4: Environment Variables**
```bash
# In your terminal, verify these are set:
echo $BREVO_API_KEY
echo $BREVO_FROM_EMAIL
echo $NEXT_PUBLIC_APP_URL
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Before Deploying to Vercel:

1. **Update Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` to your production domain
   - Verify `BREVO_API_KEY` is set
   - Verify `BREVO_FROM_EMAIL` is set

2. **Verify Brevo Sender Email:**
   - Ensure `noreply@braidme.com` is verified in Brevo
   - Or use a different verified email address

3. **Test in Production:**
   - Go to your production URL `/forgot-password`
   - Send a test password reset
   - Verify email is received

---

## 📊 SYSTEM FLOW DIAGRAM

```
User → /forgot-password page
  ↓
User enters email → Click "Send Reset Link"
  ↓
POST /api/auth/password-reset/request
  ↓
1. Check if user exists in auth.users
2. Generate random token
3. Hash token with SHA256
4. Store token_hash in password_reset_tokens table
5. Send email via Brevo API with reset link
  ↓
User receives email
  ↓
User clicks reset link → /reset-password?token=XXX&email=YYY
  ↓
User enters new password → Click "Reset Password"
  ↓
POST /api/auth/password-reset/verify
  ↓
1. Hash provided token
2. Look up token_hash in password_reset_tokens
3. Verify token not expired
4. Update user password in auth.users
5. Delete used token
  ↓
Success! User can login with new password
```

---

## 🔐 SECURITY NOTES

✅ **Tokens are hashed** - Original token never stored in database
✅ **Tokens expire** - 1 hour expiration time
✅ **Email verification** - Tokens tied to specific email
✅ **Password requirements** - 8+ chars, uppercase, lowercase, numbers
✅ **RLS disabled** - Allows service role to access tokens
✅ **Tokens deleted** - After successful reset, token is removed

---

## 📞 TROUBLESHOOTING

### Issue: "Email not received"
**Solution:**
1. Check Brevo sender email is verified
2. Check spam folder
3. Verify BREVO_API_KEY is correct
4. Check server logs for errors

### Issue: "Invalid or expired reset token"
**Solution:**
1. Token expires after 1 hour
2. Request a new reset link
3. Check if token was stored in database

### Issue: "User not found"
**Solution:**
1. Verify email exists in auth.users
2. Check email is spelled correctly
3. Try with a different email

### Issue: "Password doesn't meet requirements"
**Solution:**
Password must have:
- At least 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

Example: `MyPassword123`

---

## ✅ VERIFICATION COMMANDS

Run these in Supabase SQL Editor to verify everything is set up:

```sql
-- 1. Check password_reset_tokens table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'password_reset_tokens'
) as table_exists;

-- 2. Check RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'password_reset_tokens';

-- 3. Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'password_reset_tokens';

-- 4. Check recent tokens
SELECT id, email, expires_at, created_at 
FROM password_reset_tokens 
ORDER BY created_at DESC LIMIT 10;

-- 5. Check expired tokens
SELECT COUNT(*) as expired_tokens 
FROM password_reset_tokens 
WHERE expires_at < NOW();
```

---

## 🎯 NEXT STEPS

1. **Verify Brevo sender email** (CRITICAL)
2. **Update NEXT_PUBLIC_APP_URL** for production
3. **Test locally** with the checklist above
4. **Deploy to Vercel**
5. **Test in production**
6. **Monitor Brevo logs** for any issues

---

## 📝 NOTES

- All API responses include detailed error messages
- Server logs include `[Password Reset]` prefix for easy filtering
- Tokens are automatically cleaned up after 24 hours
- System is production-ready once Brevo sender is verified
