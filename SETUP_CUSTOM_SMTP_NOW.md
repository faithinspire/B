# ⚠️ CRITICAL: Set Up Custom SMTP — Emails Won't Work Without This

## Why emails aren't sending

Supabase's built-in email service has a hard restriction:
> **It only sends emails to members of your Supabase project team.**
> All other email addresses are silently rejected.

This is why your registered users never receive emails — they're not Supabase team members.

**The ONLY fix is to configure a custom SMTP server.**

---

## Fastest Fix: Resend (Free, 5 minutes)

### Step 1: Create a Resend account
1. Go to https://resend.com
2. Sign up for free (100 emails/day free)
3. Verify your email

### Step 2: Get your API key
1. In Resend dashboard → **API Keys**
2. Click **Create API Key**
3. Name it "BraidMe"
4. Copy the key (starts with `re_`)

### Step 3: Configure Supabase SMTP
1. Go to: https://supabase.com/dashboard/project/gymgxcspjysrkluxyavd/settings/auth
2. Scroll down to **SMTP Settings**
3. Toggle **Enable Custom SMTP** to ON
4. Fill in:
   - **Sender name:** BraidMe
   - **Sender email:** noreply@braidmee.com (or any email)
   - **Host:** smtp.resend.com
   - **Port number:** 465
   - **Username:** resend
   - **Password:** re_YOUR_API_KEY_HERE (paste your Resend API key)
5. Click **Save**

### Step 4: Set Site URL
Still in Supabase Auth settings:
1. Go to **URL Configuration** tab
2. Set **Site URL:** https://braidmee.vercel.app
3. Add **Redirect URLs:**
   - https://braidmee.vercel.app/**
   - https://braidmee.vercel.app/auth/callback
4. Click **Save**

### Step 5: Test
1. Go to your app's forgot password page
2. Enter any registered email
3. Check inbox (and spam folder)
4. Should arrive within 30 seconds

---

## Alternative: Gmail SMTP (if you have a Gmail account)

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Create an app password for "Mail"
4. In Supabase SMTP settings:
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your.email@gmail.com
   - Password: the 16-character app password

**Note:** Gmail limits to 500 emails/day. Fine for testing, not ideal for production.

---

## After Setting Up SMTP

Once custom SMTP is configured:
- ✅ Password reset emails will work
- ✅ Email confirmation emails will work
- ✅ All registered users can receive emails
- ✅ No more "Email address not authorized" errors

---

## Rate Limits After Custom SMTP

After enabling custom SMTP, Supabase sets a default limit of 30 emails/hour.
To increase this:
1. Go to **Authentication** → **Rate Limits**
2. Increase the email rate limit as needed

---

## Summary

| Before Custom SMTP | After Custom SMTP |
|---|---|
| Only Supabase team members get emails | All users get emails |
| 2 emails/hour max | 30+ emails/hour |
| No SLA | Depends on your SMTP provider |
| Free | Free (with Resend free tier) |

**This is not a code issue. It's a Supabase configuration requirement.**
