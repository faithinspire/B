# ⚠️ SUPABASE EMAIL FIX — DO THIS NOW

## Why emails aren't sending

Supabase's free tier has a **rate limit of 2 emails per hour** by default.
More importantly, the **Site URL and Redirect URLs** must be configured correctly
or Supabase silently drops the email.

---

## Step 1: Set Site URL

1. Go to: https://supabase.com/dashboard/project/gymgxcspjysrkluxyavd
2. Click **Authentication** in the left sidebar
3. Click **URL Configuration**
4. Set **Site URL** to: `https://braidmee.vercel.app`
5. Click **Save**

---

## Step 2: Add Redirect URLs

In the same **URL Configuration** page, under **Redirect URLs**, add ALL of these:

```
https://braidmee.vercel.app/**
https://braidmee.vercel.app/auth/callback
https://braidmee.vercel.app/reset-password
http://localhost:3000/**
```

Click **Save** after adding each one.

---

## Step 3: Enable Email Confirmations (if disabled)

1. Go to **Authentication** → **Providers** → **Email**
2. Make sure **Enable Email Signup** is ON
3. Check if **Confirm email** is ON or OFF:
   - If you want users to confirm email: leave ON
   - If you want instant signup (no confirmation): turn OFF
4. Click **Save**

---

## Step 4: Check Email Templates

1. Go to **Authentication** → **Email Templates**
2. Click **Confirm signup** — make sure it has content
3. Click **Reset Password** — make sure it has content
4. The `{{ .ConfirmationURL }}` variable must be in the template

---

## Step 5: Use Custom SMTP (Recommended for Production)

Supabase's built-in email is limited to 2/hour on free tier.
For production, set up custom SMTP:

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Use one of these free services:
   - **Resend** (resend.com) — 100 emails/day free
   - **SendGrid** — 100 emails/day free
   - **Mailgun** — 100 emails/day free

### Resend Setup (Easiest):
1. Sign up at resend.com
2. Add your domain or use their sandbox
3. Get your API key
4. In Supabase SMTP settings:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: `your-resend-api-key`
   - Sender email: `noreply@yourdomain.com`

---

## Step 6: Test Email

After configuring, test by:
1. Going to your app's forgot password page
2. Entering a real email address
3. Check inbox AND spam folder
4. If still not working, check Supabase logs:
   - Go to **Logs** → **Auth** in Supabase dashboard
   - Look for email-related errors

---

## Quick Test in Supabase

You can test email directly from Supabase:
1. Go to **Authentication** → **Users**
2. Find a user
3. Click the three dots → **Send magic link**
4. If this works, your email is configured correctly

---

## Summary

The most common reasons emails don't send:
1. ❌ Site URL not set → emails have wrong redirect link
2. ❌ Rate limit hit (2/hour on free tier)
3. ❌ Email going to spam
4. ❌ No custom SMTP configured (free tier limitation)

**The code is correct. This is a Supabase dashboard configuration issue.**
