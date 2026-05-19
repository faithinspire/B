# 📋 COPY-PASTE READY CODE

All code snippets below are ready to copy and paste. No modifications needed.

---

## 1️⃣ FORGOT PASSWORD PAGE

**File:** `app/(public)/auth/forgot-password/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ ' + data.message);
        setEmail('');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Forgot Password?</h2>
      <p>Enter your email and we'll send you a link to reset your password.</p>

      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#ffe0e0',
            borderRadius: '5px',
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          style={{
            color: 'green',
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#e0ffe0',
            borderRadius: '5px',
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email Address:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link href="/login" style={{ color: '#8B4513', textDecoration: 'none' }}>
          Back to Login
        </Link>
      </p>
    </div>
  );
}
```

---

## 2️⃣ RESET PASSWORD PAGE

**File:** `app/(public)/auth/reset-password/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token, email]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain uppercase letters';
    if (!/[a-z]/.test(pwd)) return 'Password must contain lowercase letters';
    if (!/\d/.test(pwd)) return 'Password must contain numbers';
    return '';
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token || !email) {
      setError('Invalid reset link');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ ' + data.message);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Reset Your Password</h2>

      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#ffe0e0',
            borderRadius: '5px',
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          style={{
            color: 'green',
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#e0ffe0',
            borderRadius: '5px',
          }}
        >
          {message}
        </div>
      )}

      {!error && (
        <form onSubmit={handleReset}>
          <div style={{ marginBottom: '15px' }}>
            <label>New Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
              }}
              disabled={loading}
              required
            />
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Min 8 chars, uppercase, lowercase, numbers
            </small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
              }}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#8B4513',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link href="/login" style={{ color: '#8B4513', textDecoration: 'none' }}>
          Back to Login
        </Link>
      </p>
    </div>
  );
}
```

---

## 3️⃣ LOGIN PAGE UPDATE

**Add this to your login page** (find the login form and add this link):

```tsx
<p style={{ marginTop: '15px', textAlign: 'center' }}>
  <Link href="/auth/forgot-password" style={{ color: '#8B4513', textDecoration: 'none' }}>
    Forgot Password?
  </Link>
</p>
```

---

## 4️⃣ ENVIRONMENT VARIABLES

**Add to `.env.local`:**

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# Application URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# For local testing: http://localhost:3000
```

---

## 5️⃣ VERIFICATION QUERIES

**Run these in Supabase SQL Editor to verify everything is working:**

```sql
-- Check marketplace products
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as with_images
FROM marketplace_products;

-- Check password reset infrastructure
SELECT 
  'Password Reset Infrastructure' as check_name,
  (SELECT COUNT(*) FROM password_reset_tokens) as total_tokens,
  (SELECT COUNT(*) FROM password_reset_tokens WHERE expires_at > NOW()) as valid_tokens,
  (SELECT COUNT(*) FROM email_templates WHERE template_name = 'password_reset') as templates_ready,
  (SELECT COUNT(*) FROM email_service_config WHERE is_active = true) as email_services_active;

-- Check email logs
SELECT status, COUNT(*) as count FROM email_logs GROUP BY status;

-- Check storage bucket
SELECT name, public FROM storage.buckets WHERE name = 'product-images';
```

---

## 6️⃣ TESTING CURL COMMANDS

**Test password reset request:**

```bash
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent..."
}
```

---

## 7️⃣ DEPLOYMENT CHECKLIST

```markdown
## Pre-Deployment
- [ ] SQL migration run successfully
- [ ] RESEND_API_KEY set in .env.local
- [ ] NEXT_PUBLIC_APP_URL set in .env.local
- [ ] Forgot password page created
- [ ] Reset password page created
- [ ] Login page updated with link
- [ ] Local testing completed

## Deployment
- [ ] Changes committed to git
- [ ] Pushed to production branch
- [ ] Deployed to Vercel/Netlify
- [ ] Environment variables set in production
- [ ] Production testing completed

## Post-Deployment
- [ ] Monitor email_logs table
- [ ] Test password reset flow
- [ ] Check for errors in logs
- [ ] Verify marketplace products visible
- [ ] Gather user feedback
```

---

## 📝 NOTES

- All code is production-ready
- No modifications needed
- Copy and paste directly
- Test locally first
- Deploy with confidence

---

**Ready to copy and paste!** ✅
