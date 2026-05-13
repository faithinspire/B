# Welcome Email Feature - Complete Guide

## What Was Added

✅ **Welcome Email on Signup** - Automatically sent when users create an account
✅ **Role-Based Content** - Different welcome messages for braiders vs customers
✅ **Professional Design** - Beautiful HTML email template with gradient header
✅ **Error Handling** - Signup succeeds even if email fails (non-blocking)
✅ **Mailtrap Integration** - Uses Mailtrap for email delivery

## How It Works

### 1. User Signs Up
- User fills signup form with email, password, name, role
- Signup API creates user in Supabase Auth
- Signup API creates profile in database

### 2. Welcome Email Sent
- Email service sends welcome email to user's email address
- Email includes role-specific onboarding steps
- Email has button to go to dashboard
- If email fails, signup still succeeds (non-blocking)

### 3. User Receives Email
- Email appears in user's inbox (via Mailtrap in dev, real email in production)
- User can click link to go to dashboard
- User can start using the app

## Email Template Features

### For Braiders:
```
✓ Welcome message
✓ Braider-specific onboarding steps:
  - Complete profile with services
  - Upload portfolio images
  - Set availability and pricing
  - Start receiving bookings
✓ Dashboard link
```

### For Customers:
```
✓ Welcome message
✓ Customer-specific onboarding steps:
  - Browse available braiders
  - View portfolios and reviews
  - Book appointments
  - Track bookings in real-time
✓ Dashboard link
```

## Files Modified

**New Files:**
- `lib/mailtrap.ts` - Email service wrapper

**Updated Files:**
- `app/api/auth/signup/route.ts` - Added welcome email sending
- `package.json` - Added nodemailer, removed resend

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `nodemailer` - Email sending library
- `@types/nodemailer` - TypeScript types

### Step 2: Create Mailtrap Account

1. Go to https://mailtrap.io
2. Sign up for a free account
3. Create a new project (e.g., "BraidMe")
4. Create an inbox (e.g., "Development")

### Step 3: Get Mailtrap Credentials

1. Go to your inbox settings
2. Click "Integrations" → "Nodemailer"
3. Copy the credentials:
   - **Host**: `smtp.mailtrap.io`
   - **Port**: `2525`
   - **Username**: (your username)
   - **Password**: (your password)

### Step 4: Update Environment Variables

Add to `.env.local`:

```env
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
MAILTRAP_FROM_EMAIL=noreply@braidme.com
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Step 5: Test Email Sending

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Sign up as a new user:
   - Go to http://localhost:3001/signup/customer (or /signup/braider)
   - Fill in the form
   - Click "Sign Up"

3. Check Mailtrap inbox:
   - Go to https://mailtrap.io
   - Open your inbox
   - You should see the welcome email
   - Click the email to see the full HTML rendering

4. Verify email content:
   - Check that it says "Welcome to BraidMe!"
   - Check that it has role-specific content
   - Check that the dashboard link works

## Production Deployment

### Step 1: Ensure Mailtrap Credentials in Vercel

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:
   - `MAILTRAP_HOST=smtp.mailtrap.io`
   - `MAILTRAP_PORT=2525`
   - `MAILTRAP_USER=your_username`
   - `MAILTRAP_PASS=your_password`
   - `MAILTRAP_FROM_EMAIL=noreply@braidme.com`
   - `NEXT_PUBLIC_APP_URL=https://your-domain.com`

### Step 2: Deploy

```bash
git add -A
git commit -m "feat: Add welcome email on signup"
git push
```

Vercel will auto-deploy.

### Step 3: Test in Production

1. Go to your production URL
2. Sign up with a test email
3. Check your email inbox for the welcome email
4. Verify the dashboard link works

## Customizing the Email

### Change Email Subject

In `app/api/auth/signup/route.ts`, change:
```typescript
subject: 'Welcome to BraidMe!',
```

### Change Email Content

Edit the HTML template in the `sendEmail` call. The template includes:
- Header with gradient background
- Welcome message
- Role-specific onboarding steps
- Dashboard button
- Footer

### Change Colors

The email uses these colors:
- Primary: `#667eea` (purple)
- Secondary: `#764ba2` (darker purple)
- Background: `#f8f9fa` (light gray)

Change these hex codes in the HTML template.

### Add More Content

You can add:
- Company logo
- Social media links
- FAQ section
- Support contact info
- Promotional offers

## Troubleshooting

### Email not sending

**Check 1**: Mailtrap credentials in `.env.local`
```bash
echo $MAILTRAP_USER
echo $MAILTRAP_PASS
```

**Check 2**: Email service is working
- Go to `/forgot-password` and test password reset email
- If that works, the service is fine

**Check 3**: Check server logs
```bash
npm run dev
# Look for error messages in terminal
```

### Email in spam folder

**In development**: This is normal with Mailtrap

**In production**: 
- Verify sender domain
- Add SPF/DKIM records
- Use Mailtrap's "Sending Domain" feature

### Email not showing role-specific content

- Check that `role` variable is being passed correctly
- Verify the conditional logic in the template
- Check browser console for errors

## Email Sending Flow

```
User Signs Up
    ↓
Signup API validates input
    ↓
Create user in Supabase Auth
    ↓
Create profile in database
    ↓
Send welcome email (async, non-blocking)
    ↓
Return success response
    ↓
User receives email
```

## Best Practices

✅ **Always wrap email sending in try-catch** - Don't fail signup if email fails
✅ **Use async/await** - Don't block the signup response
✅ **Test with real email** - Test with your actual email address
✅ **Monitor email logs** - Check Mailtrap dashboard for failures
✅ **Personalize content** - Use user's name and role
✅ **Include clear CTA** - "Go to Dashboard" button
✅ **Mobile responsive** - Email looks good on all devices

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Create Mailtrap account
3. ✅ Get credentials
4. ✅ Update `.env.local`
5. ✅ Test password reset email (to verify service works)
6. ✅ Test signup and welcome email
7. ✅ Commit and push to Vercel
8. ✅ Update Vercel environment variables
9. ✅ Test in production

## Summary

Welcome emails are now automatically sent to users when they sign up. The emails are role-specific and include onboarding steps tailored to braiders or customers. The feature is non-blocking, so signup succeeds even if email sending fails.

**Status**: Ready to test ✅
