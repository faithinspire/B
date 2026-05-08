# Verify Supabase Email Configuration - Do This Now

## Your Current Situation

✅ **Code is correct** - Using Supabase's native password reset
❌ **Emails not arriving** - Supabase email not properly configured

---

## What to Check in Supabase Dashboard

### Go Here:
1. https://supabase.com/dashboard
2. Select project: **braidmee**
3. Left sidebar → **Settings**
4. Click **Authentication**

---

## What You Should See

### Section 1: Email Auth
Look for this section and verify:
- [ ] **Email Auth** toggle is **ON** (enabled)
- [ ] **Confirm email** is set (usually "Confirm email required")

### Section 2: Email Provider
Look for this section:
- [ ] **Provider** is set to either:
  - `Supabase` (default), OR
  - `SendGrid` (if you set it up)

### Section 3: Email Templates
Scroll down and look for **Email Templates**:
- [ ] **Confirm signup** template exists
- [ ] **Reset Password** template exists ← This is what we need
- [ ] **Magic Link** template exists
- [ ] **Change Email** template exists

---

## Check the Reset Password Template

1. Click on **Reset Password** template
2. You should see:
   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset the password for your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
   ```

3. This is correct ✅

---

## Test Email Sending

### Method 1: Via Dashboard
1. Go to **Authentication** → **Users**
2. Find a test user
3. Click the **⋯** (three dots) menu
4. Select **Send Password Reset Email**
5. Check your email inbox

### Method 2: Via Your App
1. Go to: https://braidmee.vercel.app/forgot-password
2. Enter your email
3. Click "Send Reset Link"
4. Check your email inbox

---

## If Email Doesn't Arrive

### Problem 1: Email Provider Not Configured
**Solution:**
1. In Supabase Settings → Authentication
2. Look for **Email Provider** section
3. If it says "Not configured", you need to set it up

### Problem 2: Using Supabase Default (Limited)
**Solution: Switch to SendGrid**

#### Quick SendGrid Setup (5 minutes):

1. **Create SendGrid Account:**
   - Go to: https://sendgrid.com
   - Sign up (free)
   - Verify email

2. **Get API Key:**
   - In SendGrid: Settings → API Keys
   - Create new API key
   - Copy it

3. **Configure Supabase:**
   - Supabase Dashboard → Settings → Authentication
   - Find **Email Provider** section
   - Change to **SendGrid**
   - Paste API key
   - Set From Email: `noreply@braidme.com`
   - Save

4. **Test:**
   - Go to `/forgot-password`
   - Enter email
   - Check inbox

---

## What Each Setting Does

| Setting | What It Does | Your Setting |
|---------|-------------|--------------|
| Email Auth | Enables/disables email login | Should be ON |
| Confirm Email | Requires email verification | Your choice |
| Email Provider | Which service sends emails | Supabase or SendGrid |
| Reset Password Template | Email template for password reset | Already configured |

---

## Your Code is Already Correct

File: `app/api/auth/forgot-password/route.ts`

```typescript
// This is correct - uses Supabase's native password reset
const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
  redirectTo: redirectTo,
});
```

You don't need to change any code. Just configure Supabase.

---

## Step-by-Step: Make It Work

### Step 1: Verify Supabase Settings (2 minutes)
- [ ] Go to Supabase Dashboard
- [ ] Settings → Authentication
- [ ] Check Email Auth is ON
- [ ] Check Email Provider is set

### Step 2: Test Password Reset (1 minute)
- [ ] Go to `/forgot-password`
- [ ] Enter email
- [ ] Check inbox

### Step 3: If Not Working, Use SendGrid (5 minutes)
- [ ] Create SendGrid account
- [ ] Get API key
- [ ] Configure Supabase to use SendGrid
- [ ] Test again

---

## Common Issues & Fixes

### Issue 1: "Email not configured"
**Fix:** Go to Supabase Settings → Authentication → Configure Email Provider

### Issue 2: "Only one email receives emails"
**Fix:** This was the Resend issue. Supabase should work for all users.

### Issue 3: "Email arrives but link doesn't work"
**Fix:** Check that `redirectTo` URL is correct in your endpoint

### Issue 4: "Still not receiving emails"
**Fix:** Set up SendGrid as backup email provider

---

## Verification Checklist

- [ ] Supabase Email Auth is enabled
- [ ] Email Provider is configured
- [ ] Reset Password template exists
- [ ] Test email sent successfully
- [ ] Email arrives in inbox
- [ ] Reset link works
- [ ] Password can be changed
- [ ] Can log in with new password

---

## What Happens When User Resets Password

1. User goes to `/forgot-password`
2. Enters email: `user@example.com`
3. Your endpoint calls: `supabase.auth.resetPasswordForEmail('user@example.com')`
4. Supabase sends email using configured provider (Supabase or SendGrid)
5. Email arrives in user's inbox
6. User clicks reset link
7. User enters new password
8. Password is updated
9. User can log in with new password

---

## Do This Right Now

1. Open: https://supabase.com/dashboard
2. Select your project
3. Go to: Settings → Authentication
4. Verify Email Auth is ON
5. Verify Email Provider is set
6. Test password reset
7. If not working, set up SendGrid

---

## Questions?

- Supabase Docs: https://supabase.com/docs/guides/auth/auth-email
- SendGrid Docs: https://sendgrid.com/docs/
- Your code is correct: `app/api/auth/forgot-password/route.ts` ✅

