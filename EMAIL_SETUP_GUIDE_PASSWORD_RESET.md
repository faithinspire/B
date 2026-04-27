# EMAIL SETUP GUIDE - PASSWORD RESET FIX

## ⚠️ CRITICAL: Email Not Sending - Root Cause & Solution

---

## ROOT CAUSE

The password reset emails were not being sent because:
1. **RESEND_API_KEY** was missing from `.env.local`
2. **RESEND_FROM_EMAIL** was missing from `.env.local`
3. No fallback email service was configured

---

## SOLUTION: Setup Email Service

### Option 1: Use Resend (Recommended)

Resend is a modern email service that's easy to set up.

#### Step 1: Get Resend API Key
1. Go to https://resend.com
2. Sign up for a free account
3. Go to API Keys section
4. Copy your API key (starts with `re_`)

#### Step 2: Add to .env.local
```
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@braidme.com
```

#### Step 3: Verify Email Domain (Optional but Recommended)
1. In Resend dashboard, go to Domains
2. Add your domain (braidme.com)
3. Follow DNS setup instructions
4. Once verified, use: `RESEND_FROM_EMAIL=noreply@braidme.com`

#### Step 4: Test Email Sending
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check inbox for reset email
5. ✅ Should receive email within 1-2 minutes

---

### Option 2: Use Supabase Email (Built-in)

Supabase has built-in email sending, but it's limited.

#### Step 1: Configure in Supabase
1. Go to Supabase Dashboard
2. Project Settings → Email Templates
3. Enable email sending
4. Configure sender email

#### Step 2: No .env.local Changes Needed
The code will automatically use Supabase if Resend is not configured.

#### Step 3: Test Email Sending
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check inbox for reset email
5. ✅ Should receive email within 1-2 minutes

---

## CURRENT SETUP

The code has been updated to:
1. **Try Resend first** if `RESEND_API_KEY` is configured
2. **Fallback to Supabase** if Resend is not available
3. **Log errors** for debugging

---

## QUICK START: Add Resend API Key

### Step 1: Get API Key
```
Go to https://resend.com → API Keys → Copy key
```

### Step 2: Update .env.local
```
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@braidme.com
```

### Step 3: Restart Development Server
```
npm run dev
```

### Step 4: Test
1. Go to login page
2. Click "Forgot Password"
3. Enter email
4. ✅ Check inbox for email

---

## TROUBLESHOOTING

### Email Not Arriving

**Check 1: Is RESEND_API_KEY configured?**
```
Open .env.local
Look for: RESEND_API_KEY=re_...
If missing, add it
```

**Check 2: Is the API key valid?**
```
Go to https://resend.com
Check if API key is active
Regenerate if needed
```

**Check 3: Check spam folder**
```
Email might be in spam
Add noreply@braidme.com to contacts
```

**Check 4: Check server logs**
```
Look for error messages in console
Check Resend dashboard for failed sends
```

### Error: "Resend not configured"

**Solution**: Add RESEND_API_KEY to .env.local
```
RESEND_API_KEY=re_your_api_key_here
```

### Error: "Invalid API key"

**Solution**: 
1. Go to https://resend.com
2. Check if API key is correct
3. Regenerate if needed
4. Update .env.local

### Email Sent But Not Received

**Check**:
1. Is recipient email correct?
2. Is email in spam folder?
3. Check Resend dashboard for delivery status
4. Check email provider's spam settings

---

## VERIFICATION CHECKLIST

After setup, verify:

- [ ] RESEND_API_KEY is in .env.local
- [ ] RESEND_FROM_EMAIL is in .env.local
- [ ] Development server is restarted
- [ ] Go to login page
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Check inbox for email
- [ ] Email arrives within 1-2 minutes
- [ ] Email has reset link
- [ ] Reset link works

---

## EMAIL TEMPLATE

The password reset email includes:

```
Subject: Reset Your BraidMe Password

Body:
- Greeting with user's name
- Explanation of password reset
- Reset button (clickable link)
- Alternative link (copy-paste)
- Expiration notice (24 hours)
- Security note
```

---

## SECURITY NOTES

1. **Token expires in 24 hours** - User must reset within 24 hours
2. **One-time use** - Token can only be used once
3. **Secure link** - Reset link includes token and email
4. **No password in email** - Email only contains reset link
5. **HTTPS only** - Reset link uses HTTPS

---

## PRODUCTION DEPLOYMENT

### Before Going Live

1. **Get production Resend API key**
   - Go to https://resend.com
   - Create production API key
   - Use `re_live_...` key

2. **Verify domain**
   - Add braidme.com to Resend
   - Complete DNS verification
   - Use verified domain in emails

3. **Update Vercel environment**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add RESEND_API_KEY
   - Add RESEND_FROM_EMAIL

4. **Test in production**
   - Go to https://braidmee.vercel.app
   - Test forgot password flow
   - Verify email arrives

---

## COST

**Resend Pricing**:
- Free tier: 100 emails/day
- Paid: $20/month for 50,000 emails/month
- Perfect for small to medium apps

---

## NEXT STEPS

1. **Get Resend API key** (5 minutes)
2. **Add to .env.local** (1 minute)
3. **Restart server** (1 minute)
4. **Test email** (2 minutes)
5. **Deploy to production** (5 minutes)

**Total time: ~15 minutes**

---

## SUPPORT

If emails still don't work:

1. Check .env.local has RESEND_API_KEY
2. Check API key is valid at https://resend.com
3. Check server logs for errors
4. Check Resend dashboard for failed sends
5. Try Supabase email as fallback

---

## FILES MODIFIED

1. `.env.local` - Added RESEND_API_KEY and RESEND_FROM_EMAIL
2. `app/api/auth/forgot-password/route.ts` - Improved email sending with fallback

---

## STATUS

✅ Code updated to support email sending
⏳ Waiting for RESEND_API_KEY to be added to .env.local
⏳ Waiting for server restart
⏳ Waiting for testing

