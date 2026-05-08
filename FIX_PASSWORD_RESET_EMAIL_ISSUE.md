# Fix: Password Reset Email Only Sending to One Email

## Problem
The "Forgot Password" feature is only sending reset links to one specific email address, instead of sending to all registered users who request it.

## Root Cause
**Resend Domain Verification Issue**

Your Resend configuration uses `noreply@braidme.com`, but this domain is likely **not verified** in your Resend account. When a domain isn't verified, Resend restricts emails to:
- The account owner's email only
- Or a test email address

This is why only one email receives the reset link.

---

## Solution: Verify Your Domain in Resend

### Step 1: Go to Resend Dashboard
1. Open https://resend.com/dashboard
2. Log in with your account
3. Click **Domains** in the left sidebar

### Step 2: Add Your Domain
1. Click **Add Domain**
2. Enter: `braidme.com`
3. Click **Add**

### Step 3: Verify DNS Records
Resend will show you DNS records to add. You need to add these to your domain registrar:

**Example DNS records (yours will be different):**
```
Type: CNAME
Name: resend._domainkey.braidme.com
Value: [value-from-resend]

Type: MX
Name: braidme.com
Value: [value-from-resend]
```

**Where to add DNS records:**
- If using Vercel: Vercel Dashboard → Domains → DNS Records
- If using GoDaddy: GoDaddy → DNS Management
- If using Namecheap: Namecheap → DNS
- If using other registrar: Find their DNS management section

### Step 4: Wait for Verification
- DNS changes take 5-30 minutes to propagate
- Resend will automatically verify once DNS is set up
- You'll see a checkmark when verified ✅

### Step 5: Update Your Email Configuration (Optional)
Once verified, you can use any email from your domain:

**Current (works after verification):**
```
RESEND_FROM_EMAIL=noreply@braidme.com
```

**Or use a different email:**
```
RESEND_FROM_EMAIL=support@braidme.com
RESEND_FROM_EMAIL=hello@braidme.com
```

---

## Temporary Workaround (While Waiting for Verification)

If you need password reset to work immediately, use Resend's test email:

1. Go to https://resend.com/dashboard
2. Find your **Test Email** (usually shown on dashboard)
3. Update `.env.local`:
   ```
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

**Note:** This only works for testing. For production, you MUST verify your domain.

---

## Verify It's Fixed

### Test 1: Send Reset Email
1. Go to `/forgot-password`
2. Enter a test email: `testuser@gmail.com`
3. Check if email arrives in inbox

### Test 2: Check Resend Dashboard
1. Go to https://resend.com/dashboard
2. Click **Emails**
3. You should see emails sent to different addresses
4. Not just one email

### Test 3: Check Email Headers
When you receive the reset email:
1. Open the email
2. Look for "From:" header
3. Should show: `noreply@braidme.com` (or your configured email)
4. Not a generic Resend email

---

## Current Configuration

**Your current setup:**
```
RESEND_API_KEY=re_C7EgwopC_FeBNqNXmkm3mA3bVBFkwBW64
RESEND_FROM_EMAIL=noreply@braidme.com
```

**Status:** ⚠️ Domain likely not verified

**What to do:**
1. Verify `braidme.com` domain in Resend
2. Add DNS records
3. Wait for verification
4. Test password reset again

---

## Why This Happens

Resend requires domain verification for security reasons:
- Prevents spam and phishing
- Ensures you own the domain
- Protects your sender reputation
- Required for production use

Without verification, Resend restricts emails to prevent abuse.

---

## Checklist

- [ ] Go to Resend Dashboard
- [ ] Click Domains
- [ ] Add `braidme.com`
- [ ] Copy DNS records
- [ ] Add DNS records to your domain registrar
- [ ] Wait 5-30 minutes for verification
- [ ] See checkmark in Resend dashboard
- [ ] Test password reset with different email
- [ ] Verify email arrives in inbox

---

## Still Not Working?

### Check 1: Verify Domain Status
1. Go to https://resend.com/dashboard
2. Click **Domains**
3. Look for `braidme.com`
4. Should show: ✅ Verified

If not verified:
- Check DNS records are correct
- Wait longer (up to 30 minutes)
- Try re-adding the domain

### Check 2: Check Email Logs
1. Go to https://resend.com/dashboard
2. Click **Emails**
3. Look for recent emails
4. Check if they show "Sent" or "Failed"

### Check 3: Check Resend API Key
1. Go to https://resend.com/dashboard
2. Click **API Keys**
3. Verify your key matches `.env.local`
4. If not, update `.env.local` with correct key

### Check 4: Restart Your App
After updating `.env.local`:
```bash
# Stop your app (Ctrl+C)
# Restart it
npm run dev
```

---

## Production Checklist

Before going live:
- [ ] Domain verified in Resend ✅
- [ ] DNS records added ✅
- [ ] Test email sent to multiple addresses ✅
- [ ] Email arrives in inbox ✅
- [ ] Reset link works ✅
- [ ] Password can be changed ✅

---

## Support

If you need help:
1. Check Resend docs: https://resend.com/docs
2. Check DNS propagation: https://mxtoolbox.com
3. Contact Resend support: https://resend.com/support

