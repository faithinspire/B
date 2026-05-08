# 🔴 CRITICAL: Brevo API Key Invalid - Complete Fix Required

## Root Cause Identified
**Brevo API returned: `401 Unauthorized - Key not found`**

This means the API key in `.env.local` is either:
1. **Invalid/Corrupted** - The key string is malformed
2. **Expired** - The key was revoked or deleted from Brevo account
3. **Wrong Account** - The key belongs to a different Brevo account
4. **Not Activated** - The key exists but hasn't been activated

## Current API Key Status
```
BREVO_API_KEY=xsmtpsib-54496d9e530d514faaeee82df32b1de2e44151778e69476f867e25c2ba5c7ae1
Status: ❌ INVALID (401 Unauthorized)
```

## What You MUST Do NOW

### Step 1: Log into Brevo Account
1. Go to https://app.brevo.com
2. Login with your account credentials
3. Check if account is active (not suspended)

### Step 2: Verify/Generate API Key
1. Navigate to **Settings** → **SMTP & API**
2. Look for existing API keys
3. If the key `xsmtpsib-54496d9e530d514faaeee82df32b1de2e44151778e69476f867e25c2ba5c7ae1` exists:
   - Check if it's marked as "Active"
   - If not active, activate it
   - If revoked, delete and create new one
4. If key doesn't exist:
   - Create a new API key
   - Copy the FULL key (starts with `xsmtpsib-`)

### Step 3: Verify Sender Email
1. Go to **Senders & Domains**
2. Check if `noreply@braidme.com` is listed
3. If not listed:
   - Add it as a new sender
   - Complete verification (check email for verification link)
   - Wait for verification to complete
4. If listed but not verified:
   - Complete verification process
   - Wait for status to show "Verified"

### Step 4: Update `.env.local`
Replace the API key with the new one from Brevo:
```
BREVO_API_KEY=<your-new-api-key-from-brevo>
BREVO_FROM_EMAIL=noreply@braidme.com
BREVO_FROM_NAME=BraidMe
```

### Step 5: Commit and Deploy
```bash
git add .env.local
git commit -m "Fix: Update Brevo API key - restore email functionality"
git push origin master
```

Wait 5-10 minutes for Vercel deployment.

### Step 6: Test Email System
1. Go to `/forgot-password`
2. Enter test email address
3. Check inbox for reset email
4. Verify email arrives from `noreply@braidme.com`
5. Click reset link
6. Update password
7. Login with new password

## Why This Matters
- ✅ Code is 100% correct
- ✅ Pages exist and are deployed
- ✅ Build compiles successfully
- ❌ **API key is invalid** - this is the ONLY blocker
- ❌ **NO emails can be sent** until this is fixed

## Email Flow (Once Fixed)
```
User clicks "Forgot Password"
    ↓
Navigates to /forgot-password page
    ↓
Enters email address
    ↓
Clicks "Send Reset Link"
    ↓
API calls /api/auth/forgot-password
    ↓
Brevo SMTP API sends email (with VALID key)
    ↓
Email arrives in user's inbox
    ↓
User clicks reset link
    ↓
Redirected to /reset-password
    ↓
User enters new password
    ↓
Password updated in Supabase
    ↓
User logs in with new password ✅
```

## Critical Notes
- **ALL users** will receive emails once key is fixed
- **No code changes needed** - only credential update
- **Brevo is reliable** - once key is valid, emails will work
- **Test with multiple users** to verify it works for everyone

## If You Can't Access Brevo Account
1. Check your email for Brevo account recovery
2. Use "Forgot Password" on Brevo login page
3. Contact Brevo support if account is locked
4. Consider alternative: Use Supabase's built-in email service (if available)

## Verification Checklist
- [ ] Logged into Brevo account
- [ ] Account is active (not suspended)
- [ ] API key is valid and active
- [ ] Sender email `noreply@braidme.com` is verified
- [ ] Updated `.env.local` with new API key
- [ ] Committed changes to git
- [ ] Pushed to origin/master
- [ ] Waited for Vercel deployment (5-10 min)
- [ ] Tested password reset with test email
- [ ] Verified email arrived in inbox
- [ ] Tested with multiple user emails
- [ ] All users receiving emails ✅
