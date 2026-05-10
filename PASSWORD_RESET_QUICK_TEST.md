# 🚀 PASSWORD RESET EMAIL - QUICK TEST GUIDE

## IMMEDIATE TESTING (5 minutes)

### Step 1: Start the Development Server
```bash
npm run dev
```

Wait for: `ready - started server on 0.0.0.0:3000`

---

### Step 2: Test Email Service (30 seconds)

**Using Browser DevTools Console**:
```javascript
fetch('/api/auth/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-email@gmail.com' })
})
.then(r => r.json())
.then(d => console.log(d))
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "result": {
    "id": "...",
    "from": "noreply@braidme.com",
    "to": "your-email@gmail.com",
    "subject": "BraidMe Email Service Test"
  }
}
```

**Check Email**: Look in your inbox for test email from `noreply@braidme.com`

---

### Step 3: Test Complete Password Reset Flow (2 minutes)

#### 3a. Request Password Reset
1. Go to: `http://localhost:3000/login`
2. Click: **"Forgot Password?"**
3. Enter: Your email address
4. Click: **"Send Reset Link"**
5. You should see: ✅ "Check Your Email" message

#### 3b. Check Email
1. Open your email inbox
2. Look for email from: `noreply@braidme.com`
3. Subject: "Reset your BraidMe password"
4. Click the **"Reset Password"** button

#### 3c. Reset Password
1. You'll be on: `/reset-password?token=...&email=...`
2. Page should show: Password form (not error)
3. Enter new password: (min 8 characters)
4. Confirm password: (same as above)
5. Click: **"Reset Password"**
6. You should see: ✅ "Password Reset Successful"

#### 3d. Login with New Password
1. You'll be redirected to: `/login`
2. Enter your email
3. Enter your new password
4. Click: **"Sign In"**
5. You should be logged in ✅

---

## TROUBLESHOOTING QUICK FIXES

### Email Not Received?

**Fix 1: Check Spam Folder**
- Look in Spam/Junk folder
- Add `noreply@braidme.com` to contacts

**Fix 2: Verify MailerSend API Key**
```bash
# Check if key is set
echo %MAILERSEND_API_TOKEN%

# Should show: mlsn.5d1209f827a82f49e7406faeff0e1b59a21a6be4c37f3cd8a5278da92d44f410
```

**Fix 3: Check MailerSend Dashboard**
- Go to: https://app.mailersend.com
- Click: **"Emails"** in sidebar
- Look for recent emails
- Check if they show "Sent" or "Failed"

**Fix 4: Verify Domain**
- Go to: https://app.mailersend.com
- Click: **"Domains"** in sidebar
- Look for: `braidme.com`
- Should show: ✅ Verified

If not verified, see "FIX_PASSWORD_RESET_EMAIL_ISSUE.md"

---

### "Invalid or Expired Reset Link"?

**Fix 1: Token Expired**
- Tokens expire after 24 hours
- Request a new reset link

**Fix 2: Token Already Used**
- Each token can only be used once
- Request a new reset link

**Fix 3: Check Database**
```sql
-- In Supabase SQL Editor
SELECT * FROM password_reset_tokens 
WHERE email = 'your-email@gmail.com' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### "Failed to Update Password"?

**Fix 1: Check Service Role Key**
```bash
# Verify key is set
echo %SUPABASE_SERVICE_ROLE_KEY%

# Should be a long JWT token starting with eyJ...
```

**Fix 2: Check Password Requirements**
- Password must be at least 8 characters
- Try a longer password

**Fix 3: Verify User Exists**
```sql
-- In Supabase SQL Editor
SELECT id, email FROM auth.users 
WHERE email = 'your-email@gmail.com';
```

---

## TESTING CHECKLIST

### ✅ Email Service
- [ ] Test email arrives in inbox
- [ ] Email is from `noreply@braidme.com`
- [ ] Email subject is "BraidMe Email Service Test"

### ✅ Forgot Password Page
- [ ] Page loads at `/forgot-password`
- [ ] Can enter email address
- [ ] "Send Reset Link" button works
- [ ] Shows "Check Your Email" after submit

### ✅ Email with Reset Link
- [ ] Email arrives within 1-2 minutes
- [ ] Email has "Reset Password" button
- [ ] Button links to `/reset-password?token=...&email=...`

### ✅ Reset Password Page
- [ ] Page loads and validates token
- [ ] Shows password form if token is valid
- [ ] Can enter new password
- [ ] Can confirm password
- [ ] "Reset Password" button works

### ✅ Password Update
- [ ] Password is updated in Supabase
- [ ] Can login with new password
- [ ] Old password no longer works

---

## TESTING WITH DIFFERENT EMAILS

### Test 1: Gmail
```
Email: your-gmail@gmail.com
Expected: Email arrives in inbox
```

### Test 2: Outlook
```
Email: your-outlook@outlook.com
Expected: Email arrives in inbox
```

### Test 3: Work Email
```
Email: your-work@company.com
Expected: Email arrives in inbox
```

---

## PERFORMANCE TESTING

### Test Email Delivery Time
1. Note the time you click "Send Reset Link"
2. Check when email arrives
3. Expected: 1-2 minutes

### Test Token Validation
1. Click reset link immediately
2. Expected: Page loads with form
3. Try clicking link after 24 hours
4. Expected: "Invalid or expired reset link" error

---

## SECURITY TESTING

### Test 1: Token Reuse
1. Get reset link from email
2. Reset password successfully
3. Try using same link again
4. Expected: "Invalid or expired reset link" error

### Test 2: Token Tampering
1. Get reset link from email
2. Modify token in URL
3. Try to reset password
4. Expected: "Invalid or expired reset link" error

### Test 3: Wrong Email
1. Get reset link for email A
2. Try to use it for email B
3. Expected: "Invalid or expired reset link" error

---

## DEPLOYMENT TESTING

### Before Deploying

1. **Test locally**:
   ```bash
   npm run dev
   # Complete full password reset flow
   ```

2. **Build for production**:
   ```bash
   npm run build
   # Should complete without errors
   ```

3. **Test build output**:
   ```bash
   npm run start
   # Test password reset on production build
   ```

### After Deploying to Vercel

1. Go to: `https://braidmee.vercel.app/login`
2. Click: **"Forgot Password?"**
3. Complete the full flow
4. Verify email arrives
5. Verify password reset works

---

## MONITORING

### Check Server Logs

**Local Development**:
- Look at terminal where `npm run dev` is running
- Should see logs like:
  ```
  [forgot-password] Processing reset for: user@example.com
  [forgot-password] 📧 Attempting to send password reset email...
  [forgot-password] ✅ Password reset email sent successfully
  ```

### Check MailerSend Logs

1. Go to: https://app.mailersend.com
2. Click: **"Emails"** in sidebar
3. Look for recent emails
4. Click on email to see details
5. Check: Status, delivery time, bounce info

### Check Supabase Logs

1. Go to: https://app.supabase.com
2. Select your project
3. Click: **"Logs"** in sidebar
4. Look for auth-related logs
5. Check for errors

---

## COMMON ISSUES & SOLUTIONS

| Issue | Solution |
|-------|----------|
| Email not received | Check spam folder, verify domain in MailerSend |
| "Invalid reset link" | Token expired or already used, request new link |
| "Failed to update password" | Check service role key, verify user exists |
| Page shows error | Check server logs, verify environment variables |
| Token validation fails | Check database, verify token hash matches |

---

## QUICK COMMANDS

### Test Email Service
```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'
```

### Check Database
```sql
-- In Supabase SQL Editor
SELECT * FROM password_reset_tokens 
ORDER BY created_at DESC 
LIMIT 10;
```

### View Recent Logs
```bash
# In terminal where npm run dev is running
# Look for [forgot-password] or [reset-password] logs
```

---

## SUCCESS INDICATORS

✅ **Email Service Working**
- Test email arrives in inbox
- Email is from correct sender
- Email has correct subject

✅ **Password Reset Working**
- Can request reset link
- Email arrives with link
- Can reset password with link
- Can login with new password

✅ **Security Working**
- Token expires after 24 hours
- Token can only be used once
- Token is hashed in database
- Wrong email can't use token

---

## NEXT STEPS

1. ✅ Run `npm run dev`
2. ✅ Test email service
3. ✅ Test complete password reset flow
4. ✅ Fix any issues using troubleshooting guide
5. ✅ Deploy to production
6. ✅ Test on production URL

**System is ready to use!** 🎉

