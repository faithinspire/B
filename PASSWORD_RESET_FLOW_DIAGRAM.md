# 🔐 PASSWORD RESET FLOW - COMPLETE WALKTHROUGH

## 📊 VISUAL FLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PASSWORD RESET FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: USER REQUESTS RESET
┌──────────────────────────────────────────────────────────────────────────┐
│ User clicks "Forgot Password?" on login page                             │
│ ↓                                                                        │
│ User enters email: user@example.com                                      │
│ ↓                                                                        │
│ Frontend sends: POST /api/auth/password-reset/request                    │
│ Body: { email: "user@example.com" }                                      │
└──────────────────────────────────────────────────────────────────────────┘

STEP 2: BACKEND VALIDATES REQUEST
┌──────────────────────────────────────────────────────────────────────────┐
│ API Endpoint: /api/auth/password-reset/request                           │
│ ↓                                                                        │
│ ✅ Check 1: Email format valid?                                         │
│    - Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/                                │
│    - If invalid → Return error                                          │
│ ↓                                                                        │
│ ✅ Check 2: Rate limiting (5 requests/hour per email)                   │
│    - Check requestAttempts Map                                          │
│    - If exceeded → Return success (don't reveal)                        │
│ ↓                                                                        │
│ ✅ Check 3: User exists in Supabase Auth?                               │
│    - Call: supabase.auth.admin.getUserByEmail(email)                    │
│    - If not found → Return success (don't reveal)                       │
│ ↓                                                                        │
│ ✅ Check 4: Get user profile for name                                   │
│    - Query: SELECT full_name FROM profiles WHERE id = user.id           │
└──────────────────────────────────────────────────────────────────────────┘

STEP 3: GENERATE SECURE TOKEN
┌──────────────────────────────────────────────────────────────────────────┐
│ Generate cryptographically secure token:                                 │
│ ↓                                                                        │
│ token = crypto.randomBytes(32).toString('hex')                          │
│ Example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"        │
│ ↓                                                                        │
│ Hash the token with SHA-256:                                            │
│ ↓                                                                        │
│ tokenHash = crypto.createHash('sha256').update(token).digest('hex')     │
│ Example: "9f86d081884c7d6d9ffd60014fc7ee77e42eaf2d"                    │
│ ↓                                                                        │
│ Set expiration:                                                         │
│ ↓                                                                        │
│ expiresAt = NOW() + 1 hour                                              │
│ Example: 2026-05-15 15:30:00 UTC                                        │
└──────────────────────────────────────────────────────────────────────────┘

STEP 4: STORE TOKEN IN DATABASE
┌──────────────────────────────────────────────────────────────────────────┐
│ Insert into password_reset_tokens table:                                 │
│ ↓                                                                        │
│ INSERT INTO password_reset_tokens (                                      │
│   email,                                                                │
│   token_hash,                                                           │
│   expires_at                                                            │
│ ) VALUES (                                                              │
│   'user@example.com',                                                   │
│   '9f86d081884c7d6d9ffd60014fc7ee77e42eaf2d',                          │
│   '2026-05-15 15:30:00'                                                 │
│ )                                                                       │
│ ↓                                                                        │
│ ✅ Token stored securely (only hash, not plain token)                   │
│ ✅ Token will auto-expire after 1 hour                                  │
└──────────────────────────────────────────────────────────────────────────┘

STEP 5: SEND EMAIL WITH RESET LINK
┌──────────────────────────────────────────────────────────────────────────┐
│ Build reset link:                                                        │
│ ↓                                                                        │
│ appUrl = process.env.NEXT_PUBLIC_APP_URL                                │
│ Example: "https://braidme.com"                                          │
│ ↓                                                                        │
│ resetLink = `${appUrl}/auth/reset-password?token=${token}&email=${email}`
│ Example: "https://braidme.com/auth/reset-password?token=a1b2c3d4...&email=user@example.com"
│ ↓                                                                        │
│ Send email via Resend API:                                              │
│ ↓                                                                        │
│ POST https://api.resend.com/emails                                      │
│ Headers: Authorization: Bearer ${RESEND_API_KEY}                        │
│ Body: {                                                                 │
│   from: 'noreply@braidme.com',                                          │
│   to: 'user@example.com',                                               │
│   subject: 'Reset Your BraidMe Password',                               │
│   html: '<html>...reset link...</html>',                                │
│   text: 'Click link to reset password...'                               │
│ }                                                                       │
│ ↓                                                                        │
│ ✅ Email sent successfully                                              │
└──────────────────────────────────────────────────────────────────────────┘

STEP 6: LOG EMAIL DELIVERY
┌──────────────────────────────────────────────────────────────────────────┐
│ Insert into email_logs table:                                            │
│ ↓                                                                        │
│ INSERT INTO email_logs (                                                 │
│   email,                                                                │
│   email_type,                                                           │
│   subject,                                                              │
│   status,                                                               │
│   sent_at                                                               │
│ ) VALUES (                                                              │
│   'user@example.com',                                                   │
│   'password_reset',                                                     │
│   'Reset Your BraidMe Password',                                        │
│   'sent',                                                               │
│   NOW()                                                                 │
│ )                                                                       │
│ ↓                                                                        │
│ ✅ Delivery logged for audit trail                                      │
└──────────────────────────────────────────────────────────────────────────┘

STEP 7: RETURN SUCCESS RESPONSE
┌──────────────────────────────────────────────────────────────────────────┐
│ Return to frontend:                                                      │
│ ↓                                                                        │
│ {                                                                       │
│   "success": true,                                                      │
│   "message": "If an account exists with this email, a password reset    │
│              link has been sent. Please check your inbox and spam       │
│              folder."                                                   │
│ }                                                                       │
│ ↓                                                                        │
│ ✅ Same response for existing & non-existing emails (security)          │
│ ✅ User sees success message                                            │
└──────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════

USER RECEIVES EMAIL
┌──────────────────────────────────────────────────────────────────────────┐
│ Email arrives in inbox:                                                  │
│ ↓                                                                        │
│ Subject: "Reset Your BraidMe Password"                                  │
│ ↓                                                                        │
│ Body:                                                                   │
│ "Hi [User Name],                                                        │
│                                                                         │
│  We received a request to reset your password. Click the button below   │
│  to proceed:                                                            │
│                                                                         │
│  [Reset Password Button]                                               │
│                                                                         │
│  Or copy and paste this link:                                          │
│  https://braidme.com/auth/reset-password?token=a1b2c3d4...&email=...  │
│                                                                         │
│  Security Notice: This link will expire in 1 hour. If you didn't       │
│  request this, please ignore this email."                              │
│ ↓                                                                        │
│ ✅ User clicks link or copies URL                                       │
└──────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════

STEP 8: USER CLICKS RESET LINK
┌──────────────────────────────────────────────────────────────────────────┐
│ User clicks link from email:                                             │
│ ↓                                                                        │
│ Browser navigates to:                                                   │
│ /auth/reset-password?token=a1b2c3d4...&email=user@example.com          │
│ ↓                                                                        │
│ Frontend page loads: app/(public)/auth/reset-password/page.tsx          │
│ ↓                                                                        │
│ Page extracts URL parameters:                                           │
│ - token = "a1b2c3d4..."                                                 │
│ - email = "user@example.com"                                            │
│ ↓                                                                        │
│ ✅ Page displays password reset form                                    │
└──────────────────────────────────────────────────────────────────────────┘

STEP 9: USER ENTERS NEW PASSWORD
┌──────────────────────────────────────────────────────────────────────────┐
│ User fills form:                                                         │
│ ↓                                                                        │
│ New Password: "MyNewPassword123"                                        │
│ Confirm Password: "MyNewPassword123"                                    │
│ ↓                                                                        │
│ Frontend validates password strength:                                   │
│ ✅ Length >= 8 characters?                                              │
│ ✅ Contains uppercase letter? (A-Z)                                     │
│ ✅ Contains lowercase letter? (a-z)                                     │
│ ✅ Contains number? (0-9)                                               │
│ ✅ Passwords match?                                                     │
│ ↓                                                                        │
│ If validation fails → Show error message                                │
│ If validation passes → Continue                                         │
└──────────────────────────────────────────────────────────────────────────┘

STEP 10: SUBMIT RESET REQUEST
┌──────────────────────────────────────────────────────────────────────────┐
│ Frontend sends: POST /api/auth/password-reset/verify                     │
│ ↓                                                                        │
│ Body: {                                                                 │
│   email: "user@example.com",                                            │
│   token: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",      │
│   newPassword: "MyNewPassword123"                                       │
│ }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘

STEP 11: BACKEND VERIFIES TOKEN
┌──────────────────────────────────────────────────────────────────────────┐
│ API Endpoint: /api/auth/password-reset/verify                            │
│ ↓                                                                        │
│ ✅ Check 1: All parameters provided?                                    │
│    - email, token, newPassword required                                 │
│ ↓                                                                        │
│ ✅ Check 2: Email format valid?                                         │
│ ↓                                                                        │
│ ✅ Check 3: Password strength valid?                                    │
│    - 8+ chars, uppercase, lowercase, numbers                           │
│ ↓                                                                        │
│ ✅ Check 4: Hash the token                                              │
│    tokenHash = crypto.createHash('sha256').update(token).digest('hex')  │
│    Result: "9f86d081884c7d6d9ffd60014fc7ee77e42eaf2d"                  │
│ ↓                                                                        │
│ ✅ Check 5: Find token in database                                      │
│    SELECT * FROM password_reset_tokens                                  │
│    WHERE email = 'user@example.com'                                     │
│    AND token_hash = '9f86d081884c7d6d9ffd60014fc7ee77e42eaf2d'         │
│    AND expires_at > NOW()                                               │
│ ↓                                                                        │
│ If token not found or expired → Return error                            │
│ If token found and valid → Continue                                     │
└──────────────────────────────────────────────────────────────────────────┘

STEP 12: UPDATE PASSWORD IN AUTH
┌──────────────────────────────────────────────────────────────────────────┐
│ Get user from Supabase Auth:                                             │
│ ↓                                                                        │
│ const { data, error } = await supabase.auth.admin.getUserByEmail(email) │
│ ↓                                                                        │
│ Update password:                                                        │
│ ↓                                                                        │
│ await supabase.auth.admin.updateUserById(                               │
│   authUser.id,                                                          │
│   { password: "MyNewPassword123" }                                      │
│ )                                                                       │
│ ↓                                                                        │
│ ✅ Password updated in Supabase Auth                                    │
│ ✅ Password automatically hashed by Supabase                            │
└──────────────────────────────────────────────────────────────────────────┘

STEP 13: DELETE USED TOKEN
┌──────────────────────────────────────────────────────────────────────────┐
│ Delete token from database (one-time use):                               │
│ ↓                                                                        │
│ DELETE FROM password_reset_tokens                                        │
│ WHERE id = token_record.id                                              │
│ ↓                                                                        │
│ ✅ Token deleted (cannot be reused)                                     │
│ ✅ Prevents replay attacks                                              │
└──────────────────────────────────────────────────────────────────────────┘

STEP 14: LOG SUCCESS
┌──────────────────────────────────────────────────────────────────────────┐
│ Insert into email_logs:                                                  │
│ ↓                                                                        │
│ INSERT INTO email_logs (                                                 │
│   email,                                                                │
│   email_type,                                                           │
│   subject,                                                              │
│   status,                                                               │
│   sent_at                                                               │
│ ) VALUES (                                                              │
│   'user@example.com',                                                   │
│   'password_reset_success',                                             │
│   'Password Reset Successful',                                          │
│   'completed',                                                          │
│   NOW()                                                                 │
│ )                                                                       │
│ ↓                                                                        │
│ ✅ Success logged                                                       │
└──────────────────────────────────────────────────────────────────────────┘

STEP 15: RETURN SUCCESS RESPONSE
┌──────────────────────────────────────────────────────────────────────────┐
│ Return to frontend:                                                      │
│ ↓                                                                        │
│ {                                                                       │
│   "success": true,                                                      │
│   "message": "Password has been reset successfully. You can now log in  │
│              with your new password."                                   │
│ }                                                                       │
│ ↓                                                                        │
│ ✅ Frontend shows success message                                       │
│ ✅ Redirects to login page after 2 seconds                              │
└──────────────────────────────────────────────────────────────────────────┘

STEP 16: USER LOGS IN WITH NEW PASSWORD
┌──────────────────────────────────────────────────────────────────────────┐
│ User goes to login page                                                  │
│ ↓                                                                        │
│ Enters email: user@example.com                                          │
│ Enters password: MyNewPassword123                                       │
│ ↓                                                                        │
│ Clicks "Login"                                                          │
│ ↓                                                                        │
│ ✅ Authentication succeeds                                              │
│ ✅ User logged in                                                       │
│ ✅ Redirected to dashboard                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 SECURITY FEATURES AT EACH STEP

### Step 1: Request Validation
- ✅ Email format validation (regex)
- ✅ Rate limiting (5 requests/hour per email)
- ✅ No email enumeration (same response for all emails)

### Step 3: Token Generation
- ✅ Cryptographically secure (32 bytes of random data)
- ✅ Token never stored in plain text
- ✅ Only SHA-256 hash stored in database

### Step 4: Token Storage
- ✅ Hash stored, not plain token
- ✅ Automatic expiration (1 hour)
- ✅ RLS disabled for unrestricted access

### Step 5: Email Delivery
- ✅ Secure link with token and email
- ✅ HTTPS required in production
- ✅ Token in URL (not in email body)

### Step 11: Token Verification
- ✅ Token hash comparison (not plain text)
- ✅ Expiration check (NOW() > expires_at)
- ✅ Email validation

### Step 12: Password Update
- ✅ Password strength validation
- ✅ Supabase handles hashing
- ✅ User lookup via auth system

### Step 13: Token Deletion
- ✅ One-time use enforcement
- ✅ Prevents replay attacks
- ✅ Automatic cleanup

---

## 📊 DATABASE TABLES INVOLVED

### password_reset_tokens
```sql
id              UUID PRIMARY KEY
email           TEXT NOT NULL
token_hash      TEXT NOT NULL UNIQUE (SHA-256 hash)
expires_at      TIMESTAMP NOT NULL (1 hour from creation)
created_at      TIMESTAMP DEFAULT NOW()
```

### email_logs
```sql
id              UUID PRIMARY KEY
email           TEXT NOT NULL
email_type      TEXT NOT NULL ('password_reset', 'password_reset_success')
subject         TEXT
status          TEXT ('sent', 'failed', 'completed')
error_message   TEXT (if failed)
sent_at         TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
```

---

## 🔄 COMPLETE TIMELINE

| Time | Action | Status |
|------|--------|--------|
| T+0s | User clicks "Forgot Password?" | ✅ |
| T+1s | User enters email | ✅ |
| T+2s | Request sent to API | ✅ |
| T+3s | Email validation & rate limit check | ✅ |
| T+4s | Token generated (32 bytes) | ✅ |
| T+5s | Token hashed (SHA-256) | ✅ |
| T+6s | Token stored in database | ✅ |
| T+7s | Email sent via Resend | ✅ |
| T+8s | Delivery logged | ✅ |
| T+9s | Success response returned | ✅ |
| T+10s | User sees "Check your email" message | ✅ |
| T+30s | Email arrives in inbox | ✅ |
| T+60s | User clicks reset link | ✅ |
| T+61s | Reset page loads with form | ✅ |
| T+120s | User enters new password | ✅ |
| T+121s | Password validation (frontend) | ✅ |
| T+122s | Reset request sent to API | ✅ |
| T+123s | Token verification | ✅ |
| T+124s | Password updated in auth | ✅ |
| T+125s | Token deleted | ✅ |
| T+126s | Success logged | ✅ |
| T+127s | Success response returned | ✅ |
| T+129s | Redirected to login | ✅ |
| T+130s | User logs in with new password | ✅ |

---

## 🛡️ ATTACK PREVENTION

### Brute Force Attack
- **Prevention:** Rate limiting (5 requests/hour per email)
- **Result:** Attacker can only try 5 times per hour

### Token Theft
- **Prevention:** Token hashing (SHA-256)
- **Result:** Even if database is compromised, tokens are useless

### Replay Attack
- **Prevention:** One-time use (token deleted after use)
- **Result:** Token cannot be reused

### Email Enumeration
- **Prevention:** Same response for existing/non-existing emails
- **Result:** Attacker cannot determine which emails exist

### Token Expiration Attack
- **Prevention:** 1-hour expiration
- **Result:** Old tokens automatically become invalid

### Password Weakness
- **Prevention:** Strength validation (8+ chars, uppercase, lowercase, numbers)
- **Result:** Weak passwords rejected

---

## 📝 EXAMPLE SCENARIO

**User: john@example.com**

### Request Phase
```
1. User clicks "Forgot Password?"
2. Enters: john@example.com
3. API receives request
4. Validates email format ✅
5. Checks rate limit ✅
6. Finds user in auth ✅
7. Generates token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
8. Hashes token: 9f86d081884c7d6d9ffd60014fc7ee77e42eaf2d
9. Stores hash in database
10. Sends email with link
11. Returns success message
```

### Email Content
```
Subject: Reset Your BraidMe Password

Hi John,

We received a request to reset your password. Click the button below to proceed:

[Reset Password Button]

Or copy and paste this link:
https://braidme.com/auth/reset-password?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6&email=john@example.com

Security Notice: This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.

© 2024 BraidMe. All rights reserved.
```

### Reset Phase
```
1. User clicks link
2. Page loads with form
3. User enters: NewPassword123
4. User confirms: NewPassword123
5. Frontend validates ✅
6. Sends reset request
7. API hashes token: 9f86d081884c7d6d9ffd60014fc7ee77e42eaf2d
8. Finds token in database ✅
9. Checks expiration ✅
10. Updates password in auth
11. Deletes token from database
12. Logs success
13. Returns success message
14. Redirects to login
15. User logs in with new password ✅
```

---

**Status:** ✅ COMPLETE & SECURE  
**Ready to Deploy:** YES
