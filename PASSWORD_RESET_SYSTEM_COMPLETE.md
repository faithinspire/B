# Password Reset System - Complete Implementation

## Status: ✅ READY FOR TESTING

The password reset system has been completely cleaned up and is now using **Supabase's built-in recovery link generation** which is the most reliable method.

---

## What Was Fixed

### 1. **Cleaned Up forgot-password Route** ✅
- **File**: `app/api/auth/forgot-password/route.ts`
- **Removed**: All old MailerSend helper functions (lines 70+)
- **Now Uses**: Supabase's `generateLink()` method with type 'recovery'
- **Why**: Supabase handles email sending internally - no external API needed

### 2. **Implemented Proper Token Storage** ✅
- Tokens are now stored in `password_reset_tokens` table
- Tokens expire after 24 hours
- One-time use enforcement in reset endpoint

### 3. **Frontend Pages** ✅
- `/forgot-password` - Request reset link
- `/reset-password` - Set new password with token validation

### 4. **API Endpoints** ✅
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Complete password reset
- `POST /api/auth/verify-reset-token` - Validate token before reset

---

## How It Works

### Step 1: User Requests Password Reset
```
User enters email → POST /api/auth/forgot-password
```

**What happens:**
1. Email is validated and normalized
2. User existence is checked (silently - no info leak)
3. Supabase generates a recovery link
4. Token is stored in `password_reset_tokens` table
5. User sees: "If an account exists with this email, a password reset link has been sent"

### Step 2: User Clicks Email Link
- Supabase sends the recovery link via its built-in email service
- Link format: `https://your-app.com/reset-password?token=XXX&email=user@example.com`

### Step 3: User Sets New Password
```
User enters new password → POST /api/auth/reset-password
```

**What happens:**
1. Token is validated (must exist and not expired)
2. Password is updated via Supabase Auth Admin API
3. Token is deleted (one-time use)
4. Expired tokens are cleaned up
5. User is redirected to login

---

## Critical: Supabase Email Configuration

### ⚠️ IMPORTANT: Enable Email in Supabase Dashboard

For the system to work, you MUST configure Supabase email settings:

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Project: BraidMe

2. **Navigate to Settings → Email**
   - Look for "Email Templates" or "Auth" section

3. **Configure Email Provider**
   - Option A: Use Supabase's built-in email (free tier limited)
   - Option B: Connect SendGrid, Mailgun, or AWS SES

4. **Verify Sender Email**
   - Default: `noreply@[project-id].supabase.co`
   - Or configure custom domain

5. **Test Email Sending**
   - Use Supabase dashboard to send test email
   - Verify it arrives in inbox

---

## Testing the System

### Test 1: Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### Test 2: Check Email
- Look for email from Supabase
- Click the recovery link
- Should redirect to `/reset-password?token=XXX&email=test@example.com`

### Test 3: Verify Token
```bash
curl -X POST http://localhost:3000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token":"XXX","email":"test@example.com"}'
```

**Expected Response:**
```json
{
  "valid": true,
  "email": "test@example.com"
}
```

### Test 4: Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"XXX","email":"test@example.com","password":"NewPassword123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

---

## Database Schema Required

### password_reset_tokens Table
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, token_hash)
);

-- Index for faster lookups
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
```

---

## Troubleshooting

### Issue: "Failed to send reset email"
**Cause**: Supabase email not configured
**Solution**: 
1. Go to Supabase Dashboard → Settings → Email
2. Configure email provider (SendGrid, Mailgun, etc.)
3. Test email sending from dashboard

### Issue: "Invalid or expired reset token"
**Cause**: Token doesn't exist or has expired
**Solution**:
1. Request a new password reset
2. Use the link within 24 hours
3. Check that `password_reset_tokens` table exists

### Issue: "User not found"
**Cause**: Email doesn't exist in Supabase Auth
**Solution**:
1. Verify user was created with correct email
2. Check email case sensitivity
3. Ensure user confirmed email (if required)

### Issue: "Server not configured"
**Cause**: Missing environment variables
**Solution**:
1. Check `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Restart dev server after updating `.env.local`

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Optional (for future email customization):
```
MAILERSEND_API_TOKEN=your-token
MAILERSEND_FROM_EMAIL=noreply@braidme.com
MAILERSEND_FROM_NAME=BraidMe
```

---

## Files Modified

1. ✅ `app/api/auth/forgot-password/route.ts` - Cleaned up, now uses Supabase
2. ✅ `app/api/auth/reset-password/route.ts` - Already correct
3. ✅ `app/api/auth/verify-reset-token/route.ts` - Already correct
4. ✅ `app/(public)/forgot-password/page.tsx` - Already correct
5. ✅ `app/(public)/reset-password/page.tsx` - Already correct

---

## Next Steps

1. **Verify Supabase Email Configuration**
   - Go to Supabase Dashboard
   - Check Settings → Email
   - Configure email provider if needed

2. **Test the System**
   - Run dev server: `npm run dev`
   - Go to `/forgot-password`
   - Enter test email
   - Check if email arrives

3. **Monitor Logs**
   - Check browser console for errors
   - Check server logs for detailed info
   - Look for `[forgot-password]` prefix in logs

4. **Deploy to Production**
   - Ensure Supabase email is configured in production
   - Test with real email address
   - Monitor for any issues

---

## Security Notes

✅ **Implemented:**
- Tokens are hashed with SHA256
- Tokens expire after 24 hours
- One-time use enforcement
- Email validation
- User existence check (silent - no info leak)
- Password minimum length (8 characters)
- Service role key used (not anon key)

---

## Support

If emails still aren't being sent:

1. **Check Supabase Logs**
   - Supabase Dashboard → Logs
   - Look for email sending errors

2. **Verify Email Configuration**
   - Supabase Dashboard → Settings → Email
   - Ensure provider is connected

3. **Test Supabase Email Directly**
   - Use Supabase dashboard to send test email
   - Verify it works before testing app

4. **Check Spam Folder**
   - Emails might be marked as spam
   - Add sender to contacts

---

**Last Updated**: May 10, 2026
**Status**: Ready for Testing ✅
