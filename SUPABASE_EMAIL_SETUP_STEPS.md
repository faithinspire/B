# Supabase Email Setup - Step by Step

## What You Need to Do RIGHT NOW

Your password reset code is already correct. You just need to configure Supabase to send emails to all users.

---

## Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard
2. Log in with your account
3. Click on your project: **braidmee** (or your project name)

---

## Step 2: Go to Authentication Settings

1. In the left sidebar, click **Settings**
2. Click **Authentication**
3. You should see various auth options

---

## Step 3: Check Email Provider Configuration

Look for the **Email Provider** section:

### Current Setup (Likely):
- Provider: **Supabase** (default)
- Status: May show "Not configured" or "Configured"

### What You Need:
The email provider should be set to send to ALL users, not just team members.

---

## Step 4: Configure Email Templates

1. Still in **Settings** → **Authentication**
2. Scroll down to **Email Templates**
3. You should see several templates:
   - Confirm signup
   - **Reset Password** ← This one
   - Magic Link
   - Change Email

4. Click on **Reset Password**
5. You should see:
   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset the password for your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
   ```

This template is already correct ✅

---

## Step 5: Enable Email Auth

1. In **Settings** → **Authentication**
2. Look for **Email Auth** section
3. Make sure the toggle is **ON** (enabled)
4. Check that **Confirm email** is set to your preference

---

## Step 6: Test Password Reset

### Test Method 1: Via Dashboard
1. Go to **Authentication** → **Users**
2. Find any user
3. Click the three dots menu (⋯)
4. Select **Send Password Reset Email**
5. Check if email arrives

### Test Method 2: Via Your App
1. Go to your app: https://braidmee.vercel.app
2. Click **Forgot Password**
3. Enter an email address
4. Check if email arrives in inbox

---

## If Emails Still Don't Arrive

### Problem: Supabase's Default Email Has Limitations

**Solution: Use SendGrid Instead**

### Setup SendGrid (5 minutes)

#### Step 1: Create SendGrid Account
1. Go to: https://sendgrid.com
2. Click **Sign Up**
3. Fill in details
4. Verify your email

#### Step 2: Create API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `BraidMe Password Reset`
4. Select **Full Access**
5. Click **Create & View**
6. **Copy the key** (you'll need it)

#### Step 3: Configure Supabase to Use SendGrid
1. Go back to Supabase Dashboard
2. **Settings** → **Authentication**
3. Look for **Email Provider** section
4. Change from **Supabase** to **SendGrid**
5. Paste your SendGrid API key
6. Set **From Email**: `noreply@braidme.com`
7. Click **Save**

#### Step 4: Test Again
1. Go to `/forgot-password`
2. Enter email
3. Check inbox

---

## What's Happening in Your Code

Your endpoint is already correct:

```typescript
// File: app/api/auth/forgot-password/route.ts

const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
  redirectTo: redirectTo,
});
```

This tells Supabase to send a password reset email. Supabase will use whatever email provider you configured (Supabase default or SendGrid).

---

## Quick Checklist

### Verify Supabase Email is Configured:
- [ ] Go to Supabase Dashboard
- [ ] Settings → Authentication
- [ ] Email Auth is **ON**
- [ ] Email Templates → Reset Password exists
- [ ] Email Provider is set (Supabase or SendGrid)

### Test Password Reset:
- [ ] Go to `/forgot-password`
- [ ] Enter email address
- [ ] Check inbox for reset email
- [ ] Click reset link
- [ ] Enter new password
- [ ] Log in with new password

### If Not Working:
- [ ] Set up SendGrid (free)
- [ ] Configure Supabase to use SendGrid
- [ ] Test again

---

## Why This Works

1. **Before (Resend):**
   - Domain not verified
   - Only one email could receive messages
   - ❌ Didn't work

2. **Now (Supabase):**
   - Uses Supabase's email infrastructure
   - Works for all users
   - ✅ Should work

3. **If Still Not Working (SendGrid):**
   - Professional email service
   - Verified domain
   - ✅ Definitely works

---

## Important: Your Code is Already Correct

You don't need to change any code. The endpoint is using Supabase's native password reset, which is the right approach.

You just need to:
1. Configure Supabase email settings
2. Or set up SendGrid as backup

---

## Next Steps

1. **Right now:** Go to Supabase Dashboard and check email settings
2. **Test:** Try password reset with different emails
3. **If not working:** Set up SendGrid (takes 5 minutes)
4. **Verify:** Emails should arrive for all users

---

## Questions?

- Supabase Email Guide: https://supabase.com/docs/guides/auth/auth-email
- SendGrid Setup: https://sendgrid.com/docs/for-developers/sending-email/
- Your endpoint code: `app/api/auth/forgot-password/route.ts` ✅ Already correct

