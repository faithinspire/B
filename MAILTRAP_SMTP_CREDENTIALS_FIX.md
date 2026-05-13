# ⚠️ CRITICAL: Mailtrap SMTP Credentials Fix

## Problem Identified

You were using the **Mailtrap API Key** as SMTP credentials, but Mailtrap requires **separate SMTP credentials** for email sending.

**What you had:**
```
MAILTRAP_USER=ad4e934227c0808d8b8b029489fa0fa6  ❌ (This is API key, not SMTP user)
MAILTRAP_PASS=ad4e934227c0808d8b8b029489fa0fa6  ❌ (This is API key, not SMTP password)
```

**Why emails weren't sending:**
- Mailtrap SMTP authentication failed because the credentials were invalid
- The API key is for REST API calls, NOT for SMTP authentication
- SMTP requires different username and password credentials

---

## Solution: Get Correct SMTP Credentials

### Step 1: Go to Mailtrap Dashboard
1. Open https://mailtrap.io
2. Login to your account
3. Click on your **Inbox** (or create one if you don't have it)

### Step 2: Find SMTP Credentials
1. Click **Settings** (gear icon)
2. Look for **SMTP Credentials** section
3. You should see:
   - **SMTP Host:** `smtp.mailtrap.io`
   - **SMTP Port:** `2525` (or `465` for SSL)
   - **SMTP Username:** (looks like a number, e.g., `123456`)
   - **SMTP Password:** (looks like a token, e.g., `abcdef123456`)

### Step 3: Copy the Credentials
The credentials look like this (example):
```
SMTP Host: smtp.mailtrap.io
SMTP Port: 2525
SMTP Username: 123456
SMTP Password: abcdef123456789
```

---

## Update Your Environment Variables

### In `.env.local`:
```
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=YOUR_SMTP_USERNAME_HERE
MAILTRAP_PASS=YOUR_SMTP_PASSWORD_HERE
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

**Replace:**
- `YOUR_SMTP_USERNAME_HERE` with the SMTP Username from Mailtrap
- `YOUR_SMTP_PASSWORD_HERE` with the SMTP Password from Mailtrap

### Example (with fake credentials):
```
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=123456
MAILTRAP_PASS=abcdef123456789
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

---

## Code Changes Made

### Updated `lib/mailtrap.ts`:
```typescript
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.MAILTRAP_PORT || '2525'),
  secure: false, // TLS for port 2525
  auth: {
    user: process.env.MAILTRAP_USER || '',
    pass: process.env.MAILTRAP_PASS || '',
  },
});
```

**Key changes:**
- ✅ Added `secure: false` for TLS (required for port 2525)
- ✅ Removed hardcoded API key fallback
- ✅ Now requires proper SMTP credentials from environment

---

## Testing After Update

### 1. Update `.env.local` with correct SMTP credentials
```bash
MAILTRAP_USER=YOUR_ACTUAL_SMTP_USERNAME
MAILTRAP_PASS=YOUR_ACTUAL_SMTP_PASSWORD
```

### 2. Restart your development server
```bash
npm run dev
```

### 3. Test signup
- Go to http://localhost:3000/signup
- Sign up as a new customer
- Check Mailtrap inbox for welcome email

### 4. Verify in Mailtrap
- Go to https://mailtrap.io
- Open your Inbox
- You should see the welcome email

---

## Troubleshooting

### Still not receiving emails?

1. **Verify SMTP credentials are correct:**
   - Go to Mailtrap dashboard
   - Copy credentials again carefully
   - Check for extra spaces or typos

2. **Check server logs:**
   - Look for "Email sent successfully" message
   - Or error message with details

3. **Verify domain/DNS:**
   - You mentioned domain and DNS are verified ✅
   - This is correct for sending from custom domain

4. **Check Mailtrap inbox:**
   - Go to https://mailtrap.io
   - Make sure you're looking at the right inbox
   - Check spam/trash folders

5. **Test with Mailtrap's test button:**
   - In Mailtrap dashboard, there's a "Send Test Email" button
   - Use this to verify SMTP connection works

---

## Important Notes

### API Key vs SMTP Credentials
- **API Key** (`ad4e934227c0808d8b8b029489fa0fa6`): Used for REST API calls
- **SMTP Username/Password**: Used for SMTP email sending (different credentials)

### Port 2525 vs 465
- **Port 2525**: TLS (set `secure: false`)
- **Port 465**: SSL (set `secure: true`)
- We're using 2525, so `secure: false` is correct

### From Email
- `MAILTRAP_FROM_EMAIL=noreply@braidme.com`
- Since your domain is verified, this should work
- If not verified, use Mailtrap's default sender email

---

## Next Steps

1. ✅ Get correct SMTP credentials from Mailtrap dashboard
2. ✅ Update `.env.local` with SMTP username and password
3. ✅ Restart development server
4. ✅ Test signup and verify email received
5. ✅ Commit changes to git
6. ✅ Deploy to Vercel with correct credentials

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Host | smtp.mailtrap.io |
| Port | 2525 |
| Secure | false (TLS) |
| Username | Get from Mailtrap dashboard |
| Password | Get from Mailtrap dashboard |
| From Email | noreply@braidme.com |

---

**Status:** 🔴 NEEDS ACTION - Update SMTP credentials in `.env.local`
