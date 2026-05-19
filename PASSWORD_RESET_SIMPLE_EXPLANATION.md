# 🔐 PASSWORD RESET - SIMPLE EXPLANATION

## THE BASIC FLOW (In Plain English)

### 1. **User Forgets Password**
- User clicks "Forgot Password?" link on login page
- User enters their email address
- Frontend sends email to API

### 2. **API Validates & Generates Token**
- API checks if email is valid
- API checks if user exists
- API generates a random 32-byte token (like a secret code)
- API hashes the token (converts it to a different format)
- API stores the hashed token in database with 1-hour expiration

### 3. **Email Sent to User**
- API sends email via Resend service
- Email contains a link with the token
- Link looks like: `https://braidme.com/auth/reset-password?token=abc123...&email=user@example.com`
- User receives email in inbox

### 4. **User Clicks Link**
- User clicks the link in email
- Browser opens reset password page
- Page shows form to enter new password

### 5. **User Enters New Password**
- User types new password (must be 8+ chars, uppercase, lowercase, numbers)
- User confirms password
- Frontend validates password strength
- Frontend sends reset request to API with token

### 6. **API Verifies Token & Updates Password**
- API hashes the token again
- API looks up token in database
- API checks if token hasn't expired
- API updates password in Supabase Auth
- API deletes token from database (one-time use)

### 7. **Success!**
- User sees "Password reset successfully" message
- User redirected to login page
- User logs in with new password

---

## 🔒 WHY IT'S SECURE

### Token Security
- **Random:** Generated with 32 bytes of cryptographic randomness
- **Hashed:** Never stored in plain text (only hash stored)
- **Unique:** Each token is different
- **Expires:** Automatically invalid after 1 hour

### Email Security
- **No enumeration:** Same response whether email exists or not
- **Rate limited:** Only 5 requests per hour per email
- **Logged:** All email attempts tracked

### Password Security
- **Strength required:** Must have uppercase, lowercase, numbers, 8+ chars
- **One-time use:** Token deleted after use (can't reuse)
- **Hashed by Supabase:** Password never stored in plain text

---

## 📊 WHAT HAPPENS IN DATABASE

### When Token is Created
```
INSERT INTO password_reset_tokens (
  email,
  token_hash,
  expires_at
) VALUES (
  'user@example.com',
  '9f86d081884c7d6d9ffd60014fc7ee77e42eaf2d',  ← SHA-256 hash
  '2026-05-15 15:30:00'  ← 1 hour from now
)
```

### When Token is Used
```
DELETE FROM password_reset_tokens
WHERE id = token_id
```
Token is deleted (one-time use)

### Email Delivery Logged
```
INSERT INTO email_logs (
  email,
  email_type,
  status
) VALUES (
  'user@example.com',
  'password_reset',
  'sent'
)
```

---

## 🔄 TIMELINE

| Step | What Happens | Time |
|------|--------------|------|
| 1 | User clicks "Forgot Password?" | T+0s |
| 2 | User enters email | T+1s |
| 3 | API validates & generates token | T+2s |
| 4 | Email sent | T+3s |
| 5 | User sees "Check your email" | T+4s |
| 6 | Email arrives in inbox | T+30s |
| 7 | User clicks link | T+60s |
| 8 | Reset page loads | T+61s |
| 9 | User enters new password | T+120s |
| 10 | API verifies token | T+121s |
| 11 | Password updated | T+122s |
| 12 | Token deleted | T+123s |
| 13 | User redirected to login | T+124s |
| 14 | User logs in with new password | T+125s |

---

## 🛡️ SECURITY FEATURES

### Rate Limiting
- **Limit:** 5 requests per hour per email
- **Purpose:** Prevent brute force attacks
- **Result:** Attacker can only try 5 times per hour

### Token Hashing
- **Method:** SHA-256
- **Purpose:** Protect token if database is compromised
- **Result:** Even if hacker gets database, tokens are useless

### One-Time Use
- **Method:** Delete token after use
- **Purpose:** Prevent replay attacks
- **Result:** Token cannot be used twice

### Email Validation
- **Method:** Regex pattern check
- **Purpose:** Reject invalid emails
- **Result:** Only valid emails processed

### Password Strength
- **Requirements:** 8+ chars, uppercase, lowercase, numbers
- **Purpose:** Prevent weak passwords
- **Result:** Strong passwords enforced

### No Email Enumeration
- **Method:** Same response for existing/non-existing emails
- **Purpose:** Don't reveal which emails are registered
- **Result:** Attacker can't determine valid emails

---

## 📱 USER EXPERIENCE

### Happy Path (Everything Works)
```
1. User clicks "Forgot Password?"
2. Enters email
3. Sees "Check your email"
4. Receives email
5. Clicks link
6. Enters new password
7. Sees "Password reset successfully"
8. Logs in with new password
9. ✅ Success!
```

### Error Cases

**Invalid Email**
```
User enters: "notanemail"
Result: Error "Invalid email format"
```

**User Not Found**
```
User enters: "nonexistent@example.com"
Result: "If email exists, reset link sent" (don't reveal)
```

**Rate Limited**
```
User requests 6 times in 1 hour
Result: "If email exists, reset link sent" (silently rate limited)
```

**Token Expired**
```
User waits 2 hours, then clicks link
Result: Error "Invalid or expired reset token"
```

**Weak Password**
```
User enters: "pass"
Result: Error "Password must be at least 8 characters"
```

**Passwords Don't Match**
```
User enters: "Password123" and "Password124"
Result: Error "Passwords do not match"
```

---

## 🔧 TECHNICAL DETAILS

### Token Generation
```javascript
// Generate random 32 bytes
const token = crypto.randomBytes(32).toString('hex');
// Result: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

// Hash with SHA-256
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
// Result: "9f86d081884c7d6d9ffd60014fc7ee77e42eaf2d"
```

### Email Link
```
https://braidme.com/auth/reset-password?token=a1b2c3d4...&email=user@example.com
```

### API Endpoints
```
POST /api/auth/password-reset/request
Body: { email: "user@example.com" }

POST /api/auth/password-reset/verify
Body: { email: "user@example.com", token: "a1b2c3d4...", newPassword: "NewPass123" }
```

---

## ✅ VERIFICATION CHECKLIST

- [x] Token generation is cryptographically secure
- [x] Token is hashed before storage
- [x] Token expires after 1 hour
- [x] Token is one-time use (deleted after use)
- [x] Email validation prevents invalid emails
- [x] Rate limiting prevents brute force
- [x] No email enumeration (same response for all)
- [x] Password strength enforced
- [x] Email delivery logged
- [x] Success logged
- [x] HTTPS required in production
- [x] All security best practices followed

---

## 🚀 READY TO USE

The password reset system is:
- ✅ Fully implemented
- ✅ Secure
- ✅ Tested
- ✅ Ready to deploy

Just follow the deployment steps in `IMMEDIATE_ACTIONS_MARKETPLACE_EMAIL.md`

---

**Status:** ✅ COMPLETE  
**Security Level:** HIGH  
**Ready to Deploy:** YES
