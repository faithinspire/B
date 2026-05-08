# 🔐 COMPLETE SUPABASE + BREVO PASSWORD RESET SETUP GUIDE

## Overview
This guide provides step-by-step instructions to set up a complete forgot password / reset password flow using Supabase Auth with Brevo (formerly Sendinblue) as the custom SMTP provider.

---

## PART 1: SUPABASE BACKEND CONFIGURATION

### Step 1: Configure Brevo SMTP in Supabase Dashboard

**Navigate to:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Project Settings** → **Auth** → **SMTP Settings**

**Enter these exact values:**

| Field | Value |
|-------|-------|
| **SMTP Host** | `smtp-relay.brevo.com` |
| **SMTP Port** | `587` |
| **SMTP Username** | Your Brevo account email (the one you registered with) |
| **SMTP Password** | Your Brevo SMTP Key (NOT your API key) |
| **Sender Name** | `BraidMe` |
| **Sender Email** | `noreply@braidme.com` |

**How to get your Brevo SMTP Key:**
1. Go to https://app.brevo.com
2. Click **Settings** → **SMTP & API**
3. Under **SMTP**, you'll see your SMTP Key
4. Copy it and paste into Supabase SMTP Password field

**Important:** The SMTP Key is different from the API Key. Make sure you're using the SMTP Key.

---

### Step 2: Configure Redirect URLs in Supabase

**Navigate to:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Project Settings** → **Auth** → **URL Configuration** → **Redirect URLs**

**Add these URLs:**

For **Production:**
```
https://braidmee.vercel.app/auth/callback
https://braidmee.vercel.app/update-password
```

For **Local Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/update-password
```

**Click "Save"** after adding each URL.

---

### Step 3: Configure Reset Password Email Template

**Navigate to:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Project Settings** → **Auth** → **Email Templates** → **Reset Password**

**Replace the template with this:**

```html
<h2>Reset your password</h2>

<p>Follow this link to reset your BraidMe password:</p>

<p>
  <a href="{{ .ConfirmationURL }}">Reset Password</a>
</p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

**Important Notes:**
- Use `{{ .ConfirmationURL }}` - this is the Supabase variable that contains the reset link
- The URL will automatically include the recovery token
- The link will redirect to your configured redirect URL with the token appended

---

## PART 2: FRONTEND IMPLEMENTATION

### Step 1: Create Forgot Password Page

Create file: `app/(public)/forgot-password/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Call Supabase to send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

      if (resetError) {
        console.error('Reset password error:', resetError);
        setError(resetError.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      // Success - show confirmation message
      setSuccess(true);
      setEmail('');
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 text-center">
            Reset Password
          </h1>
          <p className="text-gray-600 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-700 font-semibold text-sm">Check your email</p>
              <p className="text-green-600 text-sm mt-1">
                If an account exists with this email, you'll receive a password reset link shortly.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-center text-sm">
              Didn't receive an email? Check your spam folder or try again with a different email address.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Try Another Email
            </button>
          </div>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Remember your password?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Back to Login
            </Link>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>Note:</strong> Password reset links expire after 1 hour for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 2: Create Update Password Page

Create file: `app/(public)/update-password/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if there's a recovery token in the URL
        const hash = window.location.hash;
        const hasRecoveryToken = hash.includes('type=recovery');
        
        if (!session && !hasRecoveryToken) {
          setError('Invalid or expired reset link. Please request a new one.');
          setSessionValid(false);
        } else {
          setSessionValid(true);
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Failed to validate reset link');
        setSessionValid(false);
      } finally {
        setValidating(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error('Update password error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!sessionValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 text-center">
              Invalid Reset Link
            </h1>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>

          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              The reset link has expired or is invalid. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block py-3 px-6 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 text-center">
            Create New Password
          </h1>
          <p className="text-gray-600 text-center">
            Enter a new password for your BraidMe account.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-700 font-semibold text-sm">Password reset successful!</p>
              <p className="text-green-600 text-sm mt-1">
                Redirecting to login page...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-semibold text-sm">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Back to Login */}
        {!success && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Back to Login
              </Link>
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>Security:</strong> Make sure to use a strong password with a mix of letters, numbers, and symbols.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## PART 3: ENVIRONMENT VARIABLES

Make sure your `.env.local` has these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gymgxcspjysrkluxyavd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App URL (for redirect links)
NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
```

For local development, add:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## PART 4: ROUTING SETUP

Your Next.js app should have these routes:

```
app/
├── (public)/
│   ├── forgot-password/
│   │   └── page.tsx          ← Forgot password form
│   ├── update-password/
│   │   └── page.tsx          ← Reset password form
│   └── login/
│       └── page.tsx          ← Existing login page
```

---

## PART 5: EDGE CASES & ERROR HANDLING

### Expired Reset Links
- Supabase automatically expires recovery tokens after 1 hour
- The `update-password` page checks for valid session
- If expired, user is shown error and directed to request new link

### User Visiting Update Password Without Valid Session
- The page validates the session on mount
- If no valid recovery session, shows error message
- Provides link to request new reset

### Network Errors
- All API calls are wrapped in try-catch
- User-friendly error messages are displayed
- Loading states prevent double submissions

### Password Validation
- Minimum 8 characters required
- Passwords must match
- Clear error messages for validation failures

---

## PART 6: COMPLETE TESTING CHECKLIST

### Pre-Testing Setup
- [ ] Supabase SMTP configured with Brevo credentials
- [ ] Redirect URLs added to Supabase Auth settings
- [ ] Reset password email template updated
- [ ] Frontend pages created
- [ ] Environment variables configured
- [ ] App deployed or running locally

### Development Testing (Local)

#### Test 1: Forgot Password Page Loads
```
1. Go to http://localhost:3000/forgot-password
2. Verify page loads with email input
3. Verify form is interactive
```

#### Test 2: Send Reset Email
```
1. Enter a valid email address
2. Click "Send Reset Link"
3. Verify loading state appears
4. Verify success message appears
5. Check email inbox for reset email
6. Verify email is from noreply@braidme.com
7. Verify email contains reset link
```

#### Test 3: Click Reset Link
```
1. Open email from noreply@braidme.com
2. Click "Reset Password" button in email
3. Verify redirected to /update-password page
4. Verify page loads with password form
```

#### Test 4: Update Password
```
1. Enter new password (8+ characters)
2. Confirm password (must match)
3. Click "Reset Password"
4. Verify loading state appears
5. Verify success message appears
6. Verify redirected to login page
```

#### Test 5: Login with New Password
```
1. On login page, enter email
2. Enter new password
3. Click "Login"
4. Verify login succeeds
5. Verify redirected to dashboard
```

#### Test 6: Expired Link Handling
```
1. Request password reset
2. Wait 1+ hour (or manually expire in Supabase)
3. Click reset link in email
4. Verify error message appears
5. Verify link to request new reset is shown
```

#### Test 7: Invalid Session Handling
```
1. Go directly to /update-password without reset link
2. Verify error message appears
3. Verify link to forgot-password is shown
```

#### Test 8: Password Validation
```
1. Go to /update-password with valid reset link
2. Enter password < 8 characters
3. Verify error message appears
4. Enter mismatched passwords
5. Verify error message appears
6. Enter valid matching passwords
7. Verify password updates successfully
```

### Production Testing (After Deployment)

#### Test 1: Production URL
```
1. Go to https://braidmee.vercel.app/forgot-password
2. Verify page loads
3. Verify styling is correct
```

#### Test 2: Email Delivery
```
1. Request password reset with production email
2. Verify email arrives within 2 minutes
3. Verify email is from noreply@braidme.com
4. Verify reset link uses production URL
```

#### Test 3: Full Flow
```
1. Request password reset
2. Click reset link in email
3. Update password
4. Login with new password
5. Verify access to dashboard
```

#### Test 4: Multiple Users
```
Repeat full flow with 3 different email addresses:
- User 1: test1@example.com
- User 2: test2@example.com
- User 3: test3@example.com
```

### Troubleshooting

#### Email Not Arriving
- [ ] Check spam/junk folder
- [ ] Verify Brevo SMTP credentials in Supabase
- [ ] Check Brevo account for sending limits
- [ ] Verify sender email is verified in Brevo
- [ ] Check Supabase logs for errors

#### Reset Link Not Working
- [ ] Verify redirect URL is in Supabase settings
- [ ] Check if link is expired (1 hour limit)
- [ ] Verify URL format is correct
- [ ] Check browser console for errors

#### Password Update Failing
- [ ] Verify password meets requirements (8+ chars)
- [ ] Check if passwords match
- [ ] Verify Supabase connection
- [ ] Check browser console for errors

---

## PART 7: VERIFICATION COMMANDS

### Check Supabase Configuration
```bash
# Verify environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Test Email Sending (Optional)
```bash
# You can test Brevo SMTP directly
# Use any SMTP testing tool with:
# Host: smtp-relay.brevo.com
# Port: 587
# Username: your_brevo_email
# Password: your_brevo_smtp_key
```

---

## SUMMARY

You now have a complete password reset flow with:

✅ **Supabase Auth** - Handles authentication and recovery tokens
✅ **Brevo SMTP** - Sends professional password reset emails
✅ **Frontend Pages** - User-friendly forgot password and reset password forms
✅ **Error Handling** - Comprehensive edge case handling
✅ **Security** - 1-hour token expiration, password validation
✅ **Testing Checklist** - Step-by-step verification process

The flow is production-ready and handles all common scenarios!

