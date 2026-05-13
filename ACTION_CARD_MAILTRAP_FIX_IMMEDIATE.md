# 🚨 ACTION CARD: Fix Mailtrap Email Issue - DO THIS NOW

## Problem Found ✅
You were using the **API Key** as SMTP credentials, but Mailtrap requires **separate SMTP credentials**.

---

## IMMEDIATE ACTION (5 minutes)

### Step 1: Get SMTP Credentials from Mailtrap
```
1. Go to https://mailtrap.io
2. Login
3. Click your Inbox
4. Click Settings (gear icon)
5. Find "SMTP Credentials" section
6. Copy:
   - SMTP Username (looks like: 123456)
   - SMTP Password (looks like: abcdef123456)
```

### Step 2: Update `.env.local`
Replace these lines:
```
MAILTRAP_USER=ad4e934227c0808d8b8b029489fa0fa6
MAILTRAP_PASS=ad4e934227c0808d8b8b029489fa0fa6
```

With your actual SMTP credentials:
```
MAILTRAP_USER=YOUR_SMTP_USERNAME
MAILTRAP_PASS=YOUR_SMTP_PASSWORD
```

**Example:**
```
MAILTRAP_USER=123456
MAILTRAP_PASS=abcdef123456789
```

### Step 3: Restart Development Server
```bash
npm run dev
```

### Step 4: Test Email
1. Go to http://localhost:3000/signup
2. Sign up as new customer
3. Check Mailtrap inbox for welcome email

---

## What Was Fixed

### Code Change in `lib/mailtrap.ts`:
```typescript
// BEFORE (❌ Wrong):
auth: {
  user: process.env.MAILTRAP_USER || 'ad4e934227c0808d8b8b029489fa0fa6',
  pass: process.env.MAILTRAP_PASS || 'ad4e934227c0808d8b8b029489fa0fa6',
}

// AFTER (✅ Correct):
secure: false, // TLS for port 2525
auth: {
  user: process.env.MAILTRAP_USER || '',
  pass: process.env.MAILTRAP_PASS || '',
}
```

### Changes:
- ✅ Added `secure: false` for TLS (required for port 2525)
- ✅ Removed hardcoded API key fallback
- ✅ Now requires proper SMTP credentials

### Git Commit:
```
28e3d7b fix: Correct Mailtrap SMTP configuration - use TLS and remove hardcoded API key
```

---

## Why Emails Weren't Sending

| Issue | Reason |
|-------|--------|
| Using API Key as SMTP credentials | API key is for REST API, not SMTP |
| Missing `secure: false` | Port 2525 requires TLS, not SSL |
| Hardcoded fallback | Prevented proper error detection |

---

## Mailtrap Credentials Explained

### API Key (What you had):
```
ad4e934227c0808d8b8b029489fa0fa6
```
- Used for: REST API calls
- NOT for: SMTP email sending

### SMTP Credentials (What you need):
```
Username: 123456 (or similar number)
Password: abcdef123456789 (or similar token)
```
- Used for: SMTP email sending
- Found in: Mailtrap dashboard → Settings → SMTP Credentials

---

## Verification Checklist

- [ ] Got SMTP credentials from Mailtrap dashboard
- [ ] Updated MAILTRAP_USER in `.env.local`
- [ ] Updated MAILTRAP_PASS in `.env.local`
- [ ] Restarted development server (`npm run dev`)
- [ ] Tested signup at http://localhost:3000/signup
- [ ] Checked Mailtrap inbox for welcome email
- [ ] Email received successfully ✅

---

## If Still Not Working

### Check 1: Verify SMTP Credentials
```
Go to Mailtrap → Settings → SMTP Credentials
Copy credentials again carefully
Check for extra spaces or typos
```

### Check 2: Check Server Logs
```
Look for "Email sent successfully" message
Or error message with details
```

### Check 3: Test Mailtrap Connection
```
In Mailtrap dashboard, click "Send Test Email"
This verifies SMTP connection works
```

### Check 4: Verify Domain
```
You said domain and DNS are verified ✅
This is correct for custom sender email
```

---

## Next Steps After Fix

1. ✅ Update `.env.local` with SMTP credentials
2. ✅ Restart dev server
3. ✅ Test email sending
4. ✅ Commit to git (already done)
5. ✅ Push to Vercel (already done)
6. ✅ Add credentials to Vercel environment variables:
   ```
   MAILTRAP_USER=YOUR_SMTP_USERNAME
   MAILTRAP_PASS=YOUR_SMTP_PASSWORD
   ```

---

## Important Notes

### Port 2525 (TLS)
- Requires: `secure: false`
- This is what we're using ✅

### Port 465 (SSL)
- Requires: `secure: true`
- Not recommended for Mailtrap

### From Email
- `noreply@braidme.com`
- Your domain is verified ✅
- Should work correctly

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Get SMTP credentials | 2 min | ⏳ TODO |
| Update `.env.local` | 1 min | ⏳ TODO |
| Restart dev server | 1 min | ⏳ TODO |
| Test email | 2 min | ⏳ TODO |
| **Total** | **6 min** | ⏳ TODO |

---

## Support

- **Mailtrap Docs:** https://mailtrap.io/inboxes
- **SMTP Settings:** https://mailtrap.io → Settings → SMTP Credentials
- **Nodemailer Docs:** https://nodemailer.com/

---

**Status:** 🔴 NEEDS ACTION - Update SMTP credentials in `.env.local`

**Start with Step 1 above! 👆**
