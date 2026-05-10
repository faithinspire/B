# Admin Setup - Visual Flow

## The Complete Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASSWORD RESET SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Forgot Password"                                 │
│         ↓                                                       │
│  Enters email address                                          │
│         ↓                                                       │
│  API generates custom token (32 bytes)                         │
│         ↓                                                       │
│  Stores token_hash in password_reset_tokens table              │
│         ↓                                                       │
│  Sends email via Resend (noreply@braidme.com)                 │
│         ↓                                                       │
│  User clicks reset link in email                              │
│         ↓                                                       │
│  User enters new password                                      │
│         ↓                                                       │
│  ✅ Password reset complete                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## What You Need to Do

```
┌──────────────────────────────────────────────────────────────────┐
│                    YOUR SETUP CHECKLIST                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: Edit SQL File (2 minutes)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ File: COMPLETE_FIX_EMAILS_AND_ADMINS.sql                  │ │
│  │                                                            │ │
│  │ Find:                                                      │ │
│  │   'your-email-1@gmail.com'                                │ │
│  │   'your-email-2@gmail.com'                                │ │
│  │   'your-email-3@gmail.com'                                │ │
│  │                                                            │ │
│  │ Replace with YOUR emails:                                 │ │
│  │   'your-email@gmail.com'                                  │ │
│  │   'admin2@gmail.com'                                      │ │
│  │   'admin3@gmail.com'                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  STEP 2: Run SQL in Supabase (1 minute)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Go to https://supabase.com/dashboard                   │ │
│  │ 2. Select your project                                    │ │
│  │ 3. SQL Editor → New Query                                 │ │
│  │ 4. Copy entire COMPLETE_FIX_EMAILS_AND_ADMINS.sql         │ │
│  │ 5. Paste into editor                                      │ │
│  │ 6. Click Run                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  STEP 3: Verify Success (1 minute)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ You should see:                                            │ │
│  │ ✅ password_reset_tokens table created                    │ │
│  │ ✅ Your 3 admin emails listed with role = 'admin'         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  STEP 4: Verify Resend Domain (5 minutes)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Go to https://resend.com/domains                       │ │
│  │ 2. Add domain: braidme.com                                │ │
│  │ 3. Follow DNS verification steps                          │ │
│  │ 4. Wait for verification (usually instant)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  TOTAL TIME: ~8 minutes                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Database Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE CHANGES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NEW TABLE: password_reset_tokens                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ id (BIGSERIAL PRIMARY KEY)                              │  │
│  │ email (TEXT NOT NULL)                                   │  │
│  │ token_hash (TEXT NOT NULL)                              │  │
│  │ expires_at (TIMESTAMP WITH TIME ZONE)                   │  │
│  │ created_at (TIMESTAMP WITH TIME ZONE)                   │  │
│  │                                                         │  │
│  │ Indexes:                                                │  │
│  │ - idx_password_reset_tokens_email                       │  │
│  │ - idx_password_reset_tokens_expires_at                  │  │
│  │                                                         │  │
│  │ RLS: DISABLED (for API access)                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  UPDATED TABLE: profiles                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ... existing columns ...                                │  │
│  │ role (TEXT DEFAULT 'customer')                          │  │
│  │                                                         │  │
│  │ Updated rows:                                           │  │
│  │ - 3 users now have role = 'admin'                       │  │
│  │                                                         │  │
│  │ RLS: DISABLED (for API access)                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Email Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      EMAIL FLOW                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User enters email in forgot password form                      │
│         ↓                                                        │
│  POST /api/auth/forgot-password                                 │
│         ↓                                                        │
│  Generate token: crypto.randomBytes(32).toString('hex')         │
│         ↓                                                        │
│  Hash token: SHA256(token)                                      │
│         ↓                                                        │
│  Store in DB: {email, token_hash, expires_at}                   │
│         ↓                                                        │
│  Build reset link: /update-password?token=XXX&email=YYY         │
│         ↓                                                        │
│  Send via Resend:                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ From: noreply@braidme.com                                │ │
│  │ To: user@example.com                                     │ │
│  │ Subject: Reset Your BraidMe Password                     │ │
│  │ Body: HTML email with reset button                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ↓                                                        │
│  ✅ Email sent (if domain verified)                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Admin Access Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    ADMIN ACCESS FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User logs in with admin email                                  │
│         ↓                                                        │
│  Check profiles table: role = 'admin'?                          │
│         ↓                                                        │
│  YES → Grant access to /admin routes                            │
│         ↓                                                        │
│  User can access:                                               │
│  - /admin/dashboard                                             │
│  - /admin/users                                                 │
│  - /admin/payments                                              │
│  - /admin/braiders                                              │
│  - /admin/conversations                                         │
│  - /admin/verification                                          │
│  - /admin/disputes                                              │
│  - /admin/financials                                            │
│         ↓                                                        │
│  ✅ Admin dashboard fully functional                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## System Status

```
┌──────────────────────────────────────────────────────────────────┐
│                    SYSTEM STATUS                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Component                          Status      Action          │
│  ─────────────────────────────────────────────────────────────  │
│  Password Reset Endpoint             ✅ Ready    None            │
│  Custom Token Generation             ✅ Ready    None            │
│  Resend API Key                      ✅ Ready    None            │
│  Email Template                      ✅ Ready    None            │
│  Password Reset Table                ⏳ Pending  Run SQL         │
│  Admin Users Setup                   ⏳ Pending  Edit + Run SQL  │
│  Resend Domain Verification          ⏳ Pending  Verify domain   │
│                                                                  │
│  Overall: 4/7 components ready                                  │
│  Time to completion: ~8 minutes                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Quick Reference

| What | Where | How |
|------|-------|-----|
| Edit emails | `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` | Replace 3 placeholder emails |
| Run SQL | Supabase SQL Editor | Copy file, paste, click Run |
| Verify domain | https://resend.com/domains | Add braidme.com, verify DNS |
| Test password reset | http://localhost:3001/login | Click "Forgot Password" |
| Test admin access | http://localhost:3001/admin | Log in with admin email |

---

**Ready to start?** → Open `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` and replace the 3 emails!
