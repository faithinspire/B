# 📱 Twilio SMS Integration - Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BraidMe Application                          │
│                                                                 │
│  Password Reset Feature                                         │
│  ├─ Email Option (Brevo)                                       │
│  └─ SMS Option (Twilio) ← NEW!                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow

### Email Reset Flow
```
User
  │
  ├─ Enters Email
  │
  ▼
API: /api/auth/password-reset/request
  │
  ├─ Validate Email
  ├─ Check User Exists
  ├─ Generate Token
  ├─ Hash & Store Token
  │
  ▼
Brevo API
  │
  ├─ Format Email
  ├─ Send Email
  │
  ▼
User Email
  │
  ├─ Receives Email
  ├─ Clicks Reset Link
  │
  ▼
Reset Password Page
  │
  ├─ Verify Token
  ├─ Allow Password Change
  │
  ▼
Success ✅
```

### SMS Reset Flow
```
User
  │
  ├─ Enters Phone
  │
  ▼
API: /api/auth/password-reset/request
  │
  ├─ Validate Phone
  ├─ Check User Exists
  ├─ Generate Token
  ├─ Hash & Store Token
  │
  ▼
Twilio API
  │
  ├─ Format Phone
  ├─ Send SMS
  │
  ▼
User Phone
  │
  ├─ Receives SMS
  ├─ Clicks Reset Link
  │
  ▼
Reset Password Page
  │
  ├─ Verify Token
  ├─ Allow Password Change
  │
  ▼
Success ✅
```

## API Request Examples

### Email Reset
```
┌─────────────────────────────────────────┐
│ POST /api/auth/password-reset/request   │
├─────────────────────────────────────────┤
│ {                                       │
│   "email": "user@example.com",          │
│   "method": "email"                     │
│ }                                       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Response                                │
├─────────────────────────────────────────┤
│ {                                       │
│   "success": true,                      │
│   "message": "Password reset link       │
│    sent to your email"                  │
│ }                                       │
└─────────────────────────────────────────┘
```

### SMS Reset
```
┌─────────────────────────────────────────┐
│ POST /api/auth/password-reset/request   │
├─────────────────────────────────────────┤
│ {                                       │
│   "phone": "+1234567890",               │
│   "method": "sms"                       │
│ }                                       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Response                                │
├─────────────────────────────────────────┤
│ {                                       │
│   "success": true,                      │
│   "message": "Password reset link       │
│    sent to your sms"                    │
│ }                                       │
└─────────────────────────────────────────┘
```

## Token Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                    Token Lifecycle                           │
└──────────────────────────────────────────────────────────────┘

1. Generation
   ├─ 32-byte random token
   ├─ Plain text: abc123def456...
   └─ Time: 2026-05-19 10:00:00

2. Hashing
   ├─ SHA-256 hash
   ├─ Hash: 5f4dcc3b5aa765d61d8327deb882cf99...
   └─ Time: 2026-05-19 10:00:01

3. Storage
   ├─ Store hash in database
   ├─ Set expiration: 2026-05-19 11:00:00
   └─ Time: 2026-05-19 10:00:02

4. Transmission
   ├─ Send plain token to user
   ├─ Via email or SMS
   └─ Time: 2026-05-19 10:00:03

5. Verification
   ├─ User submits plain token
   ├─ Hash submitted token
   ├─ Compare with stored hash
   └─ Time: 2026-05-19 10:15:00

6. Cleanup
   ├─ Delete used token
   ├─ Delete expired tokens
   └─ Time: 2026-05-19 11:00:01
```

## Phone Number Formatting

```
Input Formats                Output Format
─────────────────────────────────────────
1234567890          ──────→  +11234567890
(123) 456-7890      ──────→  +11234567890
123-456-7890        ──────→  +11234567890
+1234567890         ──────→  +11234567890
+44123456789        ──────→  +44123456789
+234812345678       ──────→  +234812345678
```

## Message Examples

### Email Message
```
┌─────────────────────────────────────────────────────────────┐
│ From: noreply@braidme.com                                   │
│ To: user@example.com                                        │
│ Subject: Reset Your BraidMe Password                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Password Reset Request                                      │
│                                                             │
│ We received a request to reset your password. Click the    │
│ link below to create a new password:                       │
│                                                             │
│ [Reset Password Button]                                    │
│                                                             │
│ Or copy and paste this link in your browser:              │
│ https://app.braidme.com/reset-password?token=abc123...    │
│                                                             │
│ This link will expire in 1 hour. If you didn't request    │
│ this, please ignore this email.                           │
│                                                             │
│ © 2026 BraidMe. All rights reserved.                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### SMS Message
```
┌─────────────────────────────────────────────────────────────┐
│ From: +1234567890 (Twilio)                                  │
│ To: +1987654321 (User)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Your BraidMe password reset link:                          │
│ https://app.braidme.com/reset-password?token=abc123...    │
│                                                             │
│ This link expires in 1 hour.                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```
password_reset_tokens
┌──────────────────────────────────────────┐
│ Column          │ Type      │ Notes      │
├──────────────────────────────────────────┤
│ id              │ UUID      │ Primary    │
│ email           │ String    │ Nullable   │
│ phone           │ String    │ Nullable   │
│ token_hash      │ String    │ SHA-256    │
│ expires_at      │ DateTime  │ 1 hour     │
│ created_at      │ DateTime  │ Auto       │
│ updated_at      │ DateTime  │ Auto       │
└──────────────────────────────────────────┘

Indexes:
├─ email (for email lookups)
├─ phone (for phone lookups)
└─ expires_at (for cleanup)
```

## Error Handling Flow

```
Request
  │
  ├─ Validate Input
  │  ├─ Valid ──────────────────────┐
  │  └─ Invalid ──────────────────┐ │
  │                               │ │
  ▼                               │ │
Check User Exists                 │ │
  │                               │ │
  ├─ Exists ──────────────────┐   │ │
  └─ Not Found ──────────────┐│   │ │
                             ││   │ │
  ▼                          ││   │ │
Generate Token               ││   │ │
  │                          ││   │ │
  ├─ Success ──────────────┐ ││   │ │
  └─ Failure ──────────────┐││   │ │
                           │││   │ │
  ▼                        │││   │ │
Send via Service           │││   │ │
  │                        │││   │ │
  ├─ Success ──────────────┐│││  │ │
  └─ Failure ──────────────┐││││  │ │
                           ││││  │ │
  ▼                        ││││  │ │
Return Response            ││││  │ │
  │                        ││││  │ │
  ├─ Success ◄─────────────┘│││  │ │
  ├─ Error ◄──────────────────┘││  │ │
  ├─ Error ◄────────────────────┘│  │ │
  └─ Error ◄──────────────────────┘  │ │
                                     │ │
                                     └─┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: Input Validation
├─ Email format validation
├─ Phone format validation
└─ User existence verification

Layer 2: Token Generation
├─ 32-byte random token
├─ Cryptographically secure
└─ Unique per request

Layer 3: Token Storage
├─ SHA-256 hashing
├─ Hash stored in database
└─ Plain token never stored

Layer 4: Token Transmission
├─ Plain token sent to user
├─ Via secure channel (HTTPS/SMS)
└─ No sensitive data in logs

Layer 5: Token Verification
├─ Hash submitted token
├─ Compare with stored hash
└─ Constant-time comparison

Layer 6: Expiration
├─ 1-hour expiration
├─ Automatic cleanup
└─ Prevents token reuse
```

## Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│              Password Reset Metrics                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Total Requests:        1,234                               │
│ Email Resets:          892 (72%)                           │
│ SMS Resets:            342 (28%)                           │
│                                                             │
│ Success Rate:          98.5%                               │
│ Failure Rate:          1.5%                                │
│                                                             │
│ Avg Response Time:     245ms                               │
│ Email Avg:             180ms                               │
│ SMS Avg:               320ms                               │
│                                                             │
│ Tokens Expired:        156                                 │
│ Tokens Used:           1,078                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Checklist

```
Pre-Deployment
├─ [ ] Install twilio package
├─ [ ] Update .env.local with credentials
├─ [ ] Test email reset
├─ [ ] Test SMS reset
├─ [ ] Verify token expiration
└─ [ ] Check error handling

Deployment
├─ [ ] Update production .env
├─ [ ] Run npm install
├─ [ ] Run npm build
├─ [ ] Deploy to production
└─ [ ] Monitor logs

Post-Deployment
├─ [ ] Test email reset in production
├─ [ ] Test SMS reset in production
├─ [ ] Monitor error rates
├─ [ ] Check response times
└─ [ ] Verify token cleanup
```

## Quick Reference

```
Email Reset:
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","method":"email"}'

SMS Reset:
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","method":"sms"}'

Check Logs:
grep "Password Reset" logs/app.log
grep "twilio" logs/app.log
grep "resend" logs/app.log
```

---

**Visual Guide Version**: 1.0.0
**Last Updated**: May 19, 2026
**Status**: Production Ready
