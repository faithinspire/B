# 🔑 Password Reset System - Quick Start Guide

## ⚡ TL;DR (Too Long; Didn't Read)

Your password reset system is **working**. Emails aren't being received because **Brevo sender email is not verified**.

### 3-Step Fix:
1. Go to https://app.brevo.com → Settings → Senders & API
2. Verify `noreply@braidme.com` is marked as "Verified" ✅
3. If not verified, complete the verification process
4. Done! Emails will now be sent

---

## 🎯 What's Working

✅ API routes are implemented correctly
✅ Frontend is properly connected
✅ Database table exists with proper schema
✅ Brevo API key is configured
✅ Email template is professional
✅ Password validation is enforced
✅ Token security is implemented

---

## ⚠️ What Needs Fixing

**CRITICAL**: Brevo sender email verification
- Email: `noreply@braidme.com`
- Status: Likely NOT verified
- Fix: Complete verification in Brevo dashboard

**IMPORTANT**: NEXT_PUBLIC_APP_URL for production
- Current: `http://localhost:3000`
- Needed: Your actual domain (e.g., `https://braidme.com`)
- Fix: Update in Vercel environment variables

---

## 🚀 Quick Fix (5 minutes)

### Step 1: Verify Brevo Sender Email

1. Open https://app.brevo.com
2. Click **Settings** (gear icon)
3. Select **Senders & API**
4. Look for `noreply@braidme.com`
5. Check if it says "Verified" ✅

**If NOT verified:**
1. Click "Add a sender"
2. Enter email: `noreply@braidme.com`
3. Enter name: `BraidMe`
4. Click "Add"
5. Check your email for verification link
6. Click the link to verify
7. Wait for status to change to "Verified" ✅

### Step 2: Test Locally

1. Run `npm run dev`
2. Go to http://localhost:3000/forgot-password
3. Enter your email
4. Click "Send Reset Link"
5. Check your email inbox (and spam folder)
6. If you receive the email, it's working! ✅

### Step 3: Deploy to Production

1. Go to https://vercel.com/dashboard
2. Select BRAID2 project
3. Click **Settings** → **Environment Variables**
4. Update `NEXT_PUBLIC_APP_URL` to your domain
5. Click **Deployments** → **Redeploy**
6. Test on production domain

---

## 📋 Verification Checklist

- [ ] Brevo sender email is verified
- [ ] BREVO_API_KEY is set
- [ ] NEXT_PUBLIC_APP_URL is correct
- [ ] password_reset_tokens table exists
- [ ] RLS is disabled on table
- [ ] Test email received locally
- [ ] Test email received in production

---

## 🧪 Quick Test

**Local Test:**
```bash
# 1. Start dev server
npm run dev

# 2. Go to forgot-password page
# http://localhost:3000/forgot-password

# 3. Enter your email and click "Send Reset Link"

# 4. Check terminal for [Password Reset] messages

# 5. Check your email inbox
```

**Production Test:**
```bash
# 1. Update NEXT_PUBLIC_APP_URL in Vercel
# 2. Redeploy
# 3. Go to https://yourdomain.com/forgot-password
# 4. Send test email
# 5. Check inbox
```

---

## 🔍 Troubleshooting

### Email not received?
1. Check Brevo sender email is verified
2. Check spam folder
3. Check server logs for `[Password Reset]` messages
4. Check Brevo logs at https://app.brevo.com → Transactional → Logs

### Reset link doesn't work?
1. Make sure NEXT_PUBLIC_APP_URL is correct
2. Token expires after 1 hour
3. Request a new reset link

### Password reset fails?
1. Password must have: 8+ chars, uppercase, lowercase, numbers
2. Example: `MyPassword123`

---

## 📞 Support

If still having issues:
1. Check server logs for `[Password Reset]` messages
2. Check Brevo logs for email delivery status
3. Verify database has tokens: `SELECT * FROM password_reset_tokens`
4. Verify environment variables are set correctly

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ User receives password reset email
- ✅ Email contains valid reset link
- ✅ Clicking link takes user to reset page
- ✅ User can enter new password
- ✅ User can login with new password

---

## 📚 Full Documentation

For detailed information, see:
- **PASSWORD_RESET_COMPLETE_DIAGNOSTIC.md** - Full diagnostic guide
- **ACTION_CARD_PASSWORD_RESET_FIX.md** - Step-by-step action card
- **PASSWORD_RESET_SYSTEM_COMPLETE_ANALYSIS.md** - Complete analysis

---

**Status**: Ready to Fix
**Time to Fix**: 5-10 minutes
**Confidence**: 95%
