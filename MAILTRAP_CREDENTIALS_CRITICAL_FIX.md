# 🚨 CRITICAL: Mailtrap SMTP Credentials Fix Required

## Problem Identified

Your `.env.local` currently has:
```
MAILTRAP_USER=e0e8c129e8cec3851a6bb6ad9971f652
MAILTRAP_PASS=ad4e934227c0808d8b8b029489fa0fa6  ← This is the API KEY, NOT SMTP password!
```

**The `MAILTRAP_PASS` value is your Mailtrap API Key, not the SMTP password.** This is why emails aren't being sent.

## Solution: Get Correct SMTP Credentials

### Step 1: Log into Mailtrap Dashboard
1. Go to https://mailtrap.io
2. Sign in with your account

### Step 2: Find SMTP Credentials
1. Click on your **Inbox** (or the project you're using)
2. Click **Settings** (gear icon)
3. Look for **SMTP Credentials** section
4. You should see:
   - **SMTP Host**: `smtp.mailtrap.io`
   - **SMTP Port**: `2525` (or `465` for SSL)
   - **SMTP Username**: (looks like a long string, e.g., `abc123def456...`)
   - **SMTP Password**: (different from username, e.g., `xyz789uvw012...`)

### Step 3: Update `.env.local`

Replace the values in your `.env.local`:

```env
# Email Configuration (Mailtrap for welcome emails)
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=<PASTE_YOUR_SMTP_USERNAME_HERE>
MAILTRAP_PASS=<PASTE_YOUR_SMTP_PASSWORD_HERE>
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

**Example (DO NOT USE - these are fake):**
```env
MAILTRAP_USER=abc123def456ghi789jkl012mno345pqr
MAILTRAP_PASS=xyz789uvw012abc345def678ghi901jkl
```

### Step 4: Verify Domain & DNS (Already Done ✅)
You mentioned domain and DNS are verified in Mailtrap, so you're good here!

### Step 5: Test Email Sending

Once you update the credentials, test with:

```bash
curl -X POST http://localhost:3001/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

You should receive a test email within seconds.

## What Changed in Code

All these files now use Mailtrap instead of Resend:
- ✅ `app/api/auth/forgot-password/route.ts`
- ✅ `app/api/auth/test-email/route.ts`
- ✅ `app/api/bookings/[id]/sos/route.ts`
- ✅ `app/api/disputes/create/route.ts`
- ✅ `app/lib/emailService.ts`

All files now import from `lib/mailtrap.ts` which uses Nodemailer with proper SMTP configuration.

## Vercel Deployment

After updating `.env.local` locally:

1. **Push to Git** (already done ✅)
2. **Add to Vercel Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add these three variables:
     - `MAILTRAP_USER` = your SMTP username
     - `MAILTRAP_PASS` = your SMTP password
     - `MAILTRAP_FROM_EMAIL` = noreply@braidme.com
   - Click "Save"
3. **Redeploy** on Vercel (it should auto-deploy after git push)

## Why Emails Weren't Sending

1. **API Key vs SMTP Password**: Mailtrap API key is for REST API, not SMTP
2. **SMTP requires separate credentials**: Different from the API key
3. **Nodemailer needs SMTP credentials**: Not API keys

## Next Steps

1. ✅ Get SMTP credentials from Mailtrap dashboard
2. ✅ Update `.env.local` with correct credentials
3. ✅ Test locally with `/api/auth/test-email`
4. ✅ Add credentials to Vercel environment variables
5. ✅ Verify emails are being sent

---

**Status**: Vercel build is now fixed (no more resend import errors). Just need correct SMTP credentials to send emails.
