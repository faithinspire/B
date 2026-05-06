# Email Confirmation Guide

## Issue: "Email not confirmed" Error

When signing in, you may see the error: **"Please confirm your email before signing in. Check your inbox for a confirmation link."**

This is a Supabase security feature that requires users to confirm their email address before they can sign in.

## Why This Happens

1. **New Account**: When you sign up, Supabase sends a confirmation email
2. **Email Verification**: You must click the link in that email to confirm your address
3. **Security**: This prevents unauthorized account creation and spam

## Solutions

### Option 1: Use Demo Mode (Development)
If you're testing the app without a real email setup:

1. The app runs in **Demo Mode** by default (no Supabase connection)
2. You can navigate directly to pages without signing in
3. Use the navigation menu to explore features

### Option 2: Confirm Your Email (Production)
If you have Supabase configured:

1. **Sign up** with your email address
2. **Check your inbox** for a confirmation email from Supabase
3. **Click the confirmation link** in the email
4. **Return to the app** and sign in with your credentials

### Option 3: Disable Email Confirmation (Development Only)
In your Supabase dashboard:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to OFF
3. This allows sign-in without email confirmation (not recommended for production)

## Testing Signup Flow

To test the signup process:

1. Go to `/signup/braider` or `/signup/customer`
2. Fill in all required fields
3. Click "Complete Signup"
4. You'll see a success message (in demo mode)
5. In production, check your email for confirmation link

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Email not confirmed" | Email verification pending | Check inbox for confirmation link |
| "Invalid email or password" | Wrong credentials | Verify email and password are correct |
| "Too many login attempts" | Rate limit exceeded | Wait a few minutes before trying again |
| "Authentication service not available" | Supabase not configured | Check `.env.local` settings |

## Development vs Production

### Development (Demo Mode)
- No email confirmation required
- No real Supabase connection
- All pages accessible
- Perfect for UI/UX testing

### Production (Real Supabase)
- Email confirmation required
- Real database connections
- Secure authentication
- Full feature functionality

## Next Steps

1. **For Development**: Continue testing with Demo Mode
2. **For Production**: Set up a real email service (Resend, SendGrid, etc.)
3. **For Testing**: Use a test email service like Mailtrap or Ethereal

---

**Need Help?** Check the `.env.local` file to verify your Supabase credentials are configured correctly.
