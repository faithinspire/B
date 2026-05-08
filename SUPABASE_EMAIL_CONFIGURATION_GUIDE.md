# Supabase Email Configuration - Complete Guide

## Current Status
✅ Code is using Supabase's native `resetPasswordForEmail()` - this is correct
❌ Supabase's default email only works for project team members

---

## The Problem with Supabase's Default Email

Supabase provides a built-in email service, but it has limitations:
- **Only sends to project team members** by default
- Requires configuration to send to regular users
- Limited customization

---

## Solution: Configure Supabase Email Settings

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: **braidmee**
3. Go to **Settings** → **Authentication**

### Step 2: Configure Email Provider

You have 2 options:

#### Option A: Use Supabase's Built-in Email (Recommended for Testing)
1. In Authentication settings, look for **Email Provider**
2. Select **Supabase** (default)
3. This should work for all users once configured

#### Option B: Use External Email Provider (Better for Production)
Supabase allows you to use external providers:
- SendGrid
- Mailgun
- AWS SES
- Custom SMTP

**We recommend using SendGrid (free tier available):**

1. Go to https://sendgrid.com
2. Sign up for free account
3. Create API key
4. In Supabase Settings → Authentication:
   - Select **SendGrid** as provider
   - Enter API key
   - Configure sender email

---

## Step 3: Configure Email Templates

In Supabase Dashboard:
1. Go to **Settings** → **Authentication** → **Email Templates**
2. You should see:
   - Confirm signup
   - **Reset Password** ← This is what we need
   - Magic Link
   - Change Email

3. Click **Reset Password** template
4. You should see the template you mentioned:
   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset the password for your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
   ```

5. This template is already configured ✅

---

## Step 4: Enable Email for All Users

In Supabase Dashboard:
1. Go to **Settings** → **Authentication**
2. Look for **Email Auth** section
3. Make sure it's **Enabled**
4. Check **Confirm email** is set appropriately

---

## Step 5: Test the Configuration

### Test 1: Via Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Generate Link** on any user
3. Select **Send Password Reset Email**
4. Check if email arrives

### Test 2: Via Your App
1. Go to `/forgot-password`
2. Enter an email address
3. Check if reset email arrives

---

## Alternative Solution: Use a Reliable Email Service

If Supabase email isn't working, we can use a different approach:

### Option 1: SendGrid (Recommended)
- Free tier: 100 emails/day
- Reliable and widely used
- Easy to set up

### Option 2: Mailgun
- Free tier: 5,000 emails/month
- Good for production
- Excellent documentation

### Option 3: AWS SES
- Very cheap ($0.10 per 1,000 emails)
- Requires AWS account
- More complex setup

---

## Quick Fix: Use SendGrid

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up (free)
3. Verify your email

### Step 2: Create API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `BraidMe Password Reset`
4. Copy the key

### Step 3: Update Supabase
1. Go to Supabase Dashboard
2. Settings → Authentication
3. Select **SendGrid** as email provider
4. Paste API key
5. Set sender email: `noreply@braidme.com`

### Step 4: Test
1. Go to `/forgot-password`
2. Enter email
3. Check inbox

---

## Current Code Status

Your endpoint (`app/api/auth/forgot-password/route.ts`) is already correct:

```typescript
// Uses Supabase's native password reset
const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
  redirectTo: redirectTo,
});
```

This is the right approach. The issue is just configuration on Supabase's side.

---

## Checklist: Make Password Reset Work

### For Supabase's Built-in Email:
- [ ] Go to Supabase Dashboard
- [ ] Settings → Authentication
- [ ] Verify Email Auth is enabled
- [ ] Check Email Templates → Reset Password
- [ ] Test sending reset email
- [ ] Verify email arrives

### For SendGrid (If Supabase doesn't work):
- [ ] Create SendGrid account
- [ ] Create API key
- [ ] Go to Supabase Settings → Authentication
- [ ] Select SendGrid as provider
- [ ] Enter API key
- [ ] Set sender email
- [ ] Test password reset

---

## What's Happening Now

1. User goes to `/forgot-password`
2. Enters their email
3. Your endpoint calls: `supabase.auth.resetPasswordForEmail(email)`
4. Supabase sends reset email using its configured provider
5. User receives email with reset link
6. User clicks link and resets password

---

## Why It Wasn't Working Before

**With Resend:**
- Domain `braidme.com` wasn't verified
- Resend restricted emails to account owner only
- Only one email could receive messages

**With Supabase (now):**
- Should work for all users
- Just needs proper configuration

---

## Next Steps

1. **Immediate:** Go to Supabase Dashboard and verify email settings
2. **Test:** Try password reset with different email addresses
3. **If still not working:** Set up SendGrid as backup
4. **Verify:** Check that emails arrive in inbox

---

## Important Notes

- ✅ Your code is correct (using Supabase native)
- ✅ The endpoint is properly configured
- ⚠️ Just need to configure Supabase email settings
- 📧 Password reset emails should work for ALL users once configured

---

## Support Resources

- Supabase Email Docs: https://supabase.com/docs/guides/auth/auth-email
- SendGrid Setup: https://sendgrid.com/docs/for-developers/sending-email/
- Email Template Variables: https://supabase.com/docs/guides/auth/auth-email-templates

