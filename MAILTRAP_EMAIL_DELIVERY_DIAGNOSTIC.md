# Mailtrap Email Delivery Diagnostic Guide

## Current Status
✅ **Setup Complete**: Mailtrap SMTP is configured correctly in your app
✅ **Credentials**: SMTP credentials are correct in `.env.local`
✅ **Code**: Email sending code is working (no syntax errors)
❌ **Issue**: Emails are not being received in your external email inbox

## Root Cause Analysis

The most likely reason you're not receiving emails is that **Mailtrap is in SANDBOX mode** (test-only) rather than **PRODUCTION mode** (real delivery).

### How Mailtrap Works:
- **Sandbox Mode**: Emails are captured in Mailtrap's test inbox, NOT sent to real recipients
- **Production Mode**: Emails are actually delivered to real email addresses

## Diagnostic Steps (Do These Now)

### Step 1: Check Mailtrap Inbox
1. Go to https://mailtrap.io
2. Log in with your account
3. Look for your inbox (should be named something like "My Inbox" or "Testing")
4. **Check if test emails are arriving there**

**If emails ARE in Mailtrap inbox:**
- ✅ Your SMTP connection is working
- ❌ Mailtrap is in Sandbox mode (not delivering to external addresses)
- **Solution**: Switch to Production inbox or configure sending domain

**If emails are NOT in Mailtrap inbox:**
- ❌ SMTP connection issue or credentials problem
- **Solution**: Verify credentials and SMTP settings

### Step 2: Verify Mailtrap Inbox Type
1. In Mailtrap dashboard, look at your inbox settings
2. Check if it says "Sandbox" or "Production"
3. **Sandbox inboxes only capture emails for testing**
4. **Production inboxes actually deliver emails**

### Step 3: Test with Mailtrap's Test Email Feature
1. In Mailtrap dashboard, find "Send Test Email" button
2. Click it and send a test email to your address
3. Check if you receive it in your external email

## Solutions

### Option A: Switch to Production Inbox (Recommended)
1. Go to Mailtrap dashboard
2. Create a new "Production" inbox (if you don't have one)
3. Get the SMTP credentials for the Production inbox
4. Update `.env.local` with the new credentials:
   ```
   MAILTRAP_USER=<production_inbox_username>
   MAILTRAP_PASS=<production_inbox_password>
   ```
5. Add credentials to Vercel environment variables
6. Redeploy to Vercel

### Option B: Configure Sending Domain (Advanced)
If you want to use Sandbox mode with a verified domain:
1. Go to Mailtrap Settings → Sending Domain
2. Add your domain (braidme.com)
3. Verify DNS records (SPF, DKIM, DMARC)
4. Once verified, Sandbox mode can deliver to external addresses

### Option C: Use Mailtrap's API Instead of SMTP
1. Switch from SMTP to Mailtrap's API
2. Update the email service to use API calls instead
3. This gives more control over delivery

## Quick Test

To test if emails are being sent at all:

1. **Call the test endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@gmail.com"}'
   ```

2. **Check Mailtrap inbox** at https://mailtrap.io
   - If email appears there → Sandbox mode issue
   - If email doesn't appear → SMTP connection issue

3. **Check your external email** (Gmail, Outlook, etc.)
   - If you receive it → Everything is working!
   - If you don't → Mailtrap is in Sandbox mode

## Environment Variables Verification

Your current `.env.local` has:
```
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=apismtp@mailtrap.io
MAILTRAP_PASS=e0e8c129e8cec3851a6bb6ad9971f652
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

✅ These look correct for SMTP connection.

## Next Steps

1. **Immediately**: Check your Mailtrap inbox at https://mailtrap.io
2. **Verify**: Is it Sandbox or Production mode?
3. **If Sandbox**: Switch to Production inbox or configure domain
4. **Update**: Add new credentials to Vercel if needed
5. **Redeploy**: Push to master and Vercel will redeploy
6. **Test**: Try signup again and check if you receive the email

## Vercel Deployment Checklist

After making changes:
```bash
# 1. Update .env.local locally
# 2. Commit to git
git add -A
git commit -m "fix: Update Mailtrap credentials to production inbox"
git push origin master

# 3. Add to Vercel environment variables:
# - MAILTRAP_USER (new value if changed)
# - MAILTRAP_PASS (new value if changed)

# 4. Vercel will auto-redeploy
```

## Support

If you're still not receiving emails after these steps:
1. Check Vercel logs for any errors
2. Verify Mailtrap credentials are correct
3. Check if domain is verified in Mailtrap
4. Contact Mailtrap support if SMTP connection fails

---

**Created**: May 13, 2026
**Status**: Ready for diagnostic testing
