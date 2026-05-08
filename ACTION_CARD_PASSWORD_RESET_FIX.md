# Action Card: Fix Password Reset Email Issue

## Problem
Password reset emails only go to one specific email, not all registered users.

## Root Cause
**Resend domain not verified** → Resend restricts emails to account owner only

## Solution: 3 Steps

### Step 1: Verify Domain in Resend (5 minutes)
1. Go to https://resend.com/dashboard
2. Click **Domains** → **Add Domain**
3. Enter: `braidme.com`
4. Copy the DNS records shown

### Step 2: Add DNS Records (5 minutes)
Add the DNS records to your domain registrar:
- If using Vercel: Vercel Dashboard → Domains → DNS
- If using GoDaddy/Namecheap: Their DNS management section

### Step 3: Wait & Test (5-30 minutes)
- Wait for DNS to propagate (5-30 minutes)
- Resend will auto-verify when DNS is set
- Test: Go to `/forgot-password` and send reset to different email
- Verify email arrives in inbox

---

## Quick Reference

**Current Config:**
```
RESEND_FROM_EMAIL=noreply@braidme.com
RESEND_API_KEY=re_C7EgwopC_FeBNqNXmkm3mA3bVBFkwBW64
```

**Status:** ⚠️ Domain not verified

**What happens now:** Only account owner gets emails

**What happens after:** All users get reset emails ✅

---

## Temporary Workaround (If You Can't Wait)

Use Resend's test email temporarily:

1. Update `.env.local`:
   ```
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

2. Restart your app

3. Test password reset

**Note:** This is temporary. For production, verify your domain.

---

## Verification Checklist

- [ ] Go to Resend Dashboard
- [ ] Add domain `braidme.com`
- [ ] Copy DNS records
- [ ] Add DNS records to domain registrar
- [ ] Wait 5-30 minutes
- [ ] See ✅ checkmark in Resend
- [ ] Test password reset with different email
- [ ] Email arrives in inbox ✅

---

## Time Estimate
- **Setup:** 5 minutes
- **DNS propagation:** 5-30 minutes
- **Total:** 10-35 minutes

---

## Files to Reference
- `FIX_PASSWORD_RESET_EMAIL_ISSUE.md` - Detailed guide
- `app/api/auth/forgot-password/route.ts` - Implementation
- `.env.local` - Configuration

