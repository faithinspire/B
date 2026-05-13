# Root Cause Analysis: Why Emails Weren't Sending

## Executive Summary

**Problem:** Emails not being received despite domain/DNS verification in Mailtrap

**Root Cause:** Using Mailtrap API Key as SMTP credentials instead of actual SMTP credentials

**Solution:** Update `.env.local` with correct SMTP username and password from Mailtrap dashboard

**Status:** Code fixed ✅ | Awaiting credential update ⏳

---

## Detailed Analysis

### What Was Wrong

#### 1. Incorrect Credentials
```typescript
// ❌ WRONG - Using API Key
auth: {
  user: 'ad4e934227c0808d8b8b029489fa0fa6',  // API Key
  pass: 'ad4e934227c0808d8b8b029489fa0fa6',  // API Key
}
```

**Why this failed:**
- Mailtrap API Key is for REST API calls only
- SMTP authentication requires different credentials
- SMTP server rejected the authentication attempt
- Email never left the server

#### 2. Missing TLS Configuration
```typescript
// ❌ WRONG - No secure flag
const transporter = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: { ... }
  // Missing: secure: false
});
```

**Why this matters:**
- Port 2525 requires TLS (Transport Layer Security)
- Without `secure: false`, connection might fail
- SSL (port 465) requires `secure: true`
- We're using TLS, so `secure: false` is correct

#### 3. Hardcoded Fallback
```typescript
// ❌ WRONG - Hardcoded API key as fallback
user: process.env.MAILTRAP_USER || 'ad4e934227c0808d8b8b029489fa0fa6',
pass: process.env.MAILTRAP_PASS || 'ad4e934227c0808d8b8b029489fa0fa6',
```

**Why this is bad:**
- Prevents proper error detection
- Silently fails with wrong credentials
- Makes debugging harder
- Exposes credentials in code

---

## The Fix

### Code Changes in `lib/mailtrap.ts`

```typescript
// ✅ CORRECT
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.MAILTRAP_PORT || '2525'),
  secure: false, // ✅ TLS for port 2525
  auth: {
    user: process.env.MAILTRAP_USER || '',  // ✅ No hardcoded fallback
    pass: process.env.MAILTRAP_PASS || '',  // ✅ No hardcoded fallback
  },
});
```

**What changed:**
1. ✅ Added `secure: false` for TLS
2. ✅ Removed hardcoded API key fallback
3. ✅ Now requires proper SMTP credentials from environment

### Environment Variables Needed

```
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=YOUR_SMTP_USERNAME_HERE
MAILTRAP_PASS=YOUR_SMTP_PASSWORD_HERE
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

**Where to get SMTP credentials:**
1. Go to https://mailtrap.io
2. Login
3. Select your inbox
4. Click Settings ⚙️
5. Find "SMTP Credentials" section
6. Copy Username and Password

---

## Why Domain/DNS Verification Wasn't Enough

### What Domain/DNS Verification Does
✅ Allows you to send from custom domain (noreply@braidme.com)
✅ Improves email deliverability
✅ Prevents spoofing

### What It Doesn't Do
❌ Fix SMTP authentication issues
❌ Replace need for SMTP credentials
❌ Bypass authentication requirements

**Conclusion:** Domain verification is correct, but SMTP credentials are still required for authentication.

---

## Comparison: API Key vs SMTP Credentials

| Aspect | API Key | SMTP Credentials |
|--------|---------|------------------|
| **Purpose** | REST API calls | SMTP email sending |
| **Format** | Single token | Username + Password |
| **Example** | `ad4e934227c0808d8b8b029489fa0fa6` | `123456` + `abcdef123456789` |
| **Found In** | Settings → API Tokens | Settings → SMTP Credentials |
| **Used For** | API requests | Nodemailer/SMTP |
| **For Email?** | ❌ No | ✅ Yes |

---

## SMTP Authentication Flow

### What Happens When Sending Email

```
1. Nodemailer connects to smtp.mailtrap.io:2525
2. Initiates TLS connection (secure: false)
3. Sends SMTP credentials (username + password)
4. Mailtrap authenticates the credentials
   ✅ If correct: Email accepted
   ❌ If wrong: Authentication failed
5. Email sent to inbox
```

### What Was Happening Before

```
1. Nodemailer connects to smtp.mailtrap.io:2525
2. Initiates TLS connection (no secure flag)
3. Sends SMTP credentials (API Key + API Key)
4. Mailtrap authenticates the credentials
   ❌ Authentication failed (API Key not valid for SMTP)
5. Email rejected - never sent
```

---

## Git Commit

```
28e3d7b fix: Correct Mailtrap SMTP configuration - use TLS and remove hardcoded API key
```

**Changes:**
- Added `secure: false` for TLS
- Removed hardcoded API key fallback
- Updated comments to clarify SMTP credentials needed

---

## Next Steps

### Immediate (5 minutes)
1. Get SMTP credentials from Mailtrap dashboard
2. Update `.env.local` with credentials
3. Restart dev server
4. Test email sending

### Short-term (15 minutes)
1. Verify email received in Mailtrap inbox
2. Test with multiple signups
3. Check email content and styling

### Medium-term (1 hour)
1. Add credentials to Vercel environment variables
2. Deploy to production
3. Test production email sending
4. Monitor email delivery

---

## Verification

### How to Verify Fix Works

1. **Check code:**
   ```bash
   git log --oneline -1
   # Should show: fix: Correct Mailtrap SMTP configuration...
   ```

2. **Check environment:**
   ```bash
   cat .env.local | grep MAILTRAP
   # Should show your SMTP credentials
   ```

3. **Test email:**
   - Sign up at http://localhost:3000/signup
   - Check Mailtrap inbox
   - Verify email received

---

## Prevention

### To Prevent This in Future

1. **Use separate credentials:**
   - API Key for API calls
   - SMTP credentials for email sending

2. **Test SMTP connection:**
   - Use Mailtrap's "Send Test Email" button
   - Verify connection works before deploying

3. **Check documentation:**
   - Mailtrap docs clearly state SMTP credentials needed
   - Nodemailer docs show TLS configuration

4. **Monitor logs:**
   - Check server logs for email errors
   - Look for "Authentication failed" messages

---

## Summary

| Item | Status |
|------|--------|
| **Root Cause Identified** | ✅ API Key used as SMTP credentials |
| **Code Fixed** | ✅ Committed to git |
| **Documentation Created** | ✅ Multiple guides provided |
| **Awaiting** | ⏳ SMTP credentials update in `.env.local` |
| **Testing** | ⏳ After credentials updated |
| **Deployment** | ⏳ After testing successful |

---

## Resources

- **Mailtrap SMTP Settings:** https://mailtrap.io → Settings → SMTP Credentials
- **Nodemailer TLS:** https://nodemailer.com/smtp/
- **Port 2525 vs 465:** https://nodemailer.com/smtp/
- **Email Testing:** https://mailtrap.io/inboxes

---

**Action Required:** Update SMTP credentials in `.env.local` and restart dev server
