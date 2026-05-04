# IMMEDIATE EMAIL FIX - Step by Step

## What's Wrong?
Password reset emails are not being sent. The system has been improved with better logging and error handling.

## Quick Fix (5 minutes)

### Step 1: Verify Environment Variables
Open `.env.local` and check:

```env
RESEND_API_KEY=re_Zv55Uj22_5AUkTg33pAeZn7dja45XBGer
RESEND_FROM_EMAIL=noreply@braidme.com
NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
```

✅ All three should be present and correct

### Step 2: Test Email Service
Run this command in your terminal:

```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "result": {
    "id": "email_id_here",
    "from": "noreply@braidme.com",
    "to": "your-email@gmail.com",
    "subject": "BraidMe Email Service Test"
  }
}
```

### Step 3: Check Your Email
- Check inbox for test email
- Check spam/junk folder
- Wait up to 2 minutes

### Step 4: If Test Works, Test Forgot Password
1. Go to http://localhost:3000/login
2. Click "Forgot Password"
3. Enter your email
4. Open browser DevTools (F12)
5. Go to Console tab
6. Look for messages starting with `[forgot-password]`
7. Check your email for reset link

---

## Troubleshooting

### Problem: Test email fails with error
**Check the error message:**

#### Error: "RESEND_API_KEY not configured"
```
Solution:
1. Open .env.local
2. Add: RESEND_API_KEY=re_your_key_here
3. Restart dev server (Ctrl+C, then npm run dev)
4. Try again
```

#### Error: "Invalid Resend API key"
```
Solution:
1. Go to https://resend.com
2. Get a new API key
3. Update .env.local with the new key
4. Restart dev server
5. Try again
```

#### Error: "Invalid from email"
```
Solution:
1. Check RESEND_FROM_EMAIL in .env.local
2. Verify it's a valid email (e.g., noreply@braidme.com)
3. Restart dev server
4. Try again
```

#### Error: "Unauthorized"
```
Solution:
1. API key is invalid or expired
2. Go to https://resend.com/emails
3. Check if emails are being sent
4. Get a new API key if needed
5. Update .env.local
6. Restart dev server
```

### Problem: Test email succeeds but doesn't arrive
```
Solution:
1. Check spam/junk folder
2. Wait up to 2 minutes
3. Check Resend dashboard: https://resend.com/emails
4. Look for the email in the list
5. If it shows "Failed", click it to see the error
6. If it shows "Sent", check spam folder again
```

### Problem: Forgot password doesn't send email
```
Solution:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for [forgot-password] messages
4. Check for any error messages
5. If you see errors, follow the error solutions above
6. If no errors, check your email (including spam)
```

---

## Console Logs to Look For

### Success (Email Sent)
```
[forgot-password] Processing reset for: user@example.com
[forgot-password] RESEND_API_KEY configured: true
[forgot-password] Attempting to send via Resend (PRIMARY)
[forgot-password] Importing Resend SDK...
[forgot-password] Creating Resend instance...
[forgot-password] Sending email via Resend...
[forgot-password] Resend response received: { hasId: true, hasError: false }
[forgot-password] ✅ Email sent successfully via Resend: { id: '...', to: 'user@example.com' }
```

### Error (Email Failed)
```
[forgot-password] ❌ Resend failed: Error: Invalid Resend API key
[forgot-password] Falling back to Supabase
[forgot-password] ❌ Supabase also failed: Error: ...
[forgot-password] Fatal error: Error: All email services failed
```

---

## Resend API Key Setup

### If You Don't Have a Resend API Key:

1. Go to https://resend.com
2. Click "Sign Up"
3. Create an account
4. Go to "API Keys" section
5. Click "Create API Key"
6. Copy the key (starts with `re_`)
7. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your_key_here
   ```
8. Restart dev server

### Verify the Key Works:

1. Go to https://resend.com/emails
2. Send a test email from the dashboard
3. Check your inbox
4. If it arrives, the key works
5. If it doesn't, try a different email address

---

## Production Deployment

### Step 1: Commit Changes
```bash
git add app/api/auth/forgot-password/route.ts
git commit -m "fix: improve email sending with better logging and validation"
```

### Step 2: Push to Master
```bash
git push origin master
```

### Step 3: Add Environment Variables to Vercel
1. Go to https://vercel.com
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `RESEND_API_KEY` = your API key
   - `RESEND_FROM_EMAIL` = noreply@braidme.com
   - `NEXT_PUBLIC_APP_URL` = https://braidmee.vercel.app
5. Redeploy

### Step 4: Test on Production
1. Go to https://braidmee.vercel.app/login
2. Click "Forgot Password"
3. Enter your email
4. Check your email for reset link
5. Verify reset link works

---

## Quick Checklist

- [ ] `.env.local` has `RESEND_API_KEY`
- [ ] `.env.local` has `RESEND_FROM_EMAIL`
- [ ] `.env.local` has `NEXT_PUBLIC_APP_URL`
- [ ] Dev server restarted after changes
- [ ] Test email endpoint works
- [ ] Test email arrives in inbox
- [ ] Forgot password flow works
- [ ] Reset link works
- [ ] Changes committed to git
- [ ] Vercel environment variables updated
- [ ] Production deployment tested

---

## Support

If emails still aren't working:

1. **Check all environment variables** are set correctly
2. **Verify Resend API key** is valid (starts with `re_`)
3. **Check browser console** for error messages
4. **Check Resend dashboard** for failed emails
5. **Wait up to 2 minutes** for email delivery
6. **Check spam folder** for emails
7. **Try a different email address** to test
8. **Restart dev server** after any changes

---

## Files Modified
- `app/api/auth/forgot-password/route.ts` - Enhanced with better logging and validation

## Status
🟢 **READY TO TEST**

Follow the steps above to test and fix email sending.
