# Password Reset Email Service - Vercel Setup Guide

## PROBLEM IDENTIFIED

The password reset system works locally but fails on Vercel with error:
```
"Email service is not properly configured"
```

**Root Cause**: Brevo email service environment variables are not set in Vercel's production environment.

---

## SOLUTION: Configure Vercel Environment Variables

### Step 1: Access Vercel Project Settings

1. Go to **https://vercel.com/dashboard**
2. Click on your **BraidMe** project
3. Click **Settings** (top navigation bar)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add Three Brevo Configuration Variables

You need to add **3 environment variables** for the Brevo email service to work.

#### Add Variable 1: API Key
- **Name**: `BREVO_API_KEY`
- **Value**: [Your Brevo API key - starts with `xkeysib-`]
- **Environments**: Select ✅ Production, ✅ Preview, ✅ Development
- **Click**: "Add"

#### Add Variable 2: From Email
- **Name**: `BREVO_FROM_EMAIL`
- **Value**: `noreply@braidme.com`
- **Environments**: Select ✅ Production, ✅ Preview, ✅ Development
- **Click**: "Add"

#### Add Variable 3: From Name
- **Name**: `BREVO_FROM_NAME`
- **Value**: `BraidMe`
- **Environments**: Select ✅ Production, ✅ Preview, ✅ Development
- **Click**: "Add"

### Step 3: Verify Other Required Variables

Confirm these variables are already set in Vercel:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_APP_URL` (should be `https://braidme.com` for production)

### Step 4: Trigger Redeployment

After adding the variables:

1. Go to **Deployments** tab
2. Find the most recent deployment
3. Click the **three-dot menu** (⋮)
4. Select **Redeploy**
5. Wait for deployment to complete (2-3 minutes)

---

## VERIFICATION CHECKLIST

### ✅ Test Password Reset Flow

1. Open **https://braidme.com/forgot-password**
2. Enter any email address
3. Click "Send Reset Link"
4. **Expected Result**: "Password reset link sent to your email"

### ✅ Check Vercel Logs

1. Go to Vercel project → **Deployments**
2. Click the latest deployment
3. Click **Logs** tab
4. Search for `[Password Reset]` to see detailed logs
5. Look for: `✅ Email sent successfully`

### ✅ Verify Email Delivery

1. Go to **https://app.brevo.com/dashboard**
2. Navigate to **Transactional** → **Logs**
3. Look for emails sent to your test address
4. Status should show: **Sent** or **Delivered**

---

## TROUBLESHOOTING

### Issue: Still Getting "Email service not properly configured"

**Solution**:
1. Verify all 3 variables are saved in Vercel
2. Refresh the Vercel settings page
3. Make sure variables are set for **Production** environment
4. Click **Redeploy** again
5. Wait 2-3 minutes for new deployment
6. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Issue: Email Not Sending

**Check**:
1. Brevo API key is correct (starts with `xkeysib-`)
2. `BREVO_FROM_EMAIL` is verified in Brevo dashboard
3. Check Vercel logs for Brevo API errors
4. Verify Supabase `password_reset_tokens` table exists

### Issue: Deployment Stuck

**Solution**:
1. Go to Deployments tab
2. Click the stuck deployment
3. Click **Cancel** if available
4. Click **Redeploy** on a previous successful deployment
5. Then add variables and redeploy again

---

## HOW IT WORKS

### Password Reset Flow

```
User enters email
    ↓
Frontend sends POST to /api/auth/password-reset/request
    ↓
Backend validates Brevo config (BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME)
    ↓
Backend checks if user exists in Supabase
    ↓
Backend generates reset token and stores in password_reset_tokens table
    ↓
Backend sends email via Brevo API with reset link
    ↓
User receives email with reset link
    ↓
User clicks link → goes to /update-password?token=XXX&email=YYY
    ↓
Frontend validates token and email from URL
    ↓
User enters new password
    ↓
Frontend sends POST to /api/auth/password-reset/verify
    ↓
Backend updates password in Supabase auth
    ↓
User can now login with new password
```

---

## ENVIRONMENT VARIABLES REFERENCE

These are the variables needed for password reset to work:

```
# Brevo Email Service (Required for password reset emails)
BREVO_API_KEY=xkeysib-[your-key-here]
BREVO_FROM_EMAIL=noreply@braidme.com
BREVO_FROM_NAME=BraidMe

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# App URL (for reset links in emails)
NEXT_PUBLIC_APP_URL=https://braidme.com
```

---

## SECURITY NOTES

⚠️ **Important**:
- ✅ Safe to add to Vercel (encrypted at rest)
- ✅ Not visible in git history (in .gitignore)
- ✅ Only accessible to Vercel deployment
- ❌ Never commit to git
- ❌ Never share publicly
- ❌ Never paste in chat or emails

---

## NEXT STEPS

1. ✅ Go to Vercel project settings
2. ✅ Add the 3 Brevo environment variables
3. ✅ Redeploy the application
4. ✅ Test password reset flow
5. ✅ Verify email delivery in Brevo dashboard
6. ✅ Monitor Vercel logs for any errors

---

## SUPPORT

If password reset still doesn't work after following these steps:

1. **Check Vercel logs** for error messages
2. **Verify Brevo API key** is correct
3. **Confirm email** is verified in Brevo dashboard
4. **Check Supabase** password_reset_tokens table exists
5. **Review** the password reset endpoint code in `/app/api/auth/password-reset/request/route.ts`

---

**Status**: Ready to implement
**Time Required**: 5 minutes
**Impact**: Password reset emails will work on production
