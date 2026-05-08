# 📧 COMPLETE EMAIL SYSTEM TESTING GUIDE

**Status**: ✅ DEPLOYED TO VERCEL  
**Email Service**: Brevo SMTP  
**Expected Deployment Time**: 5-10 minutes

---

## 🎯 QUICK START (After Vercel Deployment)

### Test 1: Basic Password Reset (5 minutes)

**Step 1**: Go to the app
```
URL: https://braidmee.vercel.app/forgot-password
```

**Step 2**: Enter your email
```
- Click on email input field
- Type your email address
- Example: test@example.com
```

**Step 3**: Send reset link
```
- Click "Send Reset Link" button
- Wait for success message
- Should see: "Check your email"
```

**Step 4**: Check your inbox
```
- Open your email inbox
- Look for email from: noreply@braidme.com
- Subject: "Reset your BraidMe password"
- Check spam folder if not in inbox
```

**Step 5**: Click reset link
```
- Open the email
- Click "Reset Password" button
- Should redirect to /reset-password page
```

**Step 6**: Create new password
```
- Enter new password (8+ characters)
- Confirm password
- Click "Reset Password"
- Should see success message
- Auto-redirect to login page
```

**Step 7**: Login with new password
```
- Go to /login
- Enter email
- Enter new password
- Click "Sign In"
- Should login successfully
```

---

## 🧪 DETAILED TESTING SCENARIOS

### Scenario 1: Valid Email Address

**Test Case**: User with existing account
```
Email: user@example.com
Expected: Email sent successfully
Result: ✅ PASS
```

**Steps**:
1. Go to `/forgot-password`
2. Enter `user@example.com`
3. Click "Send Reset Link"
4. Check inbox for email
5. Click reset link
6. Update password
7. Login with new password

---

### Scenario 2: Multiple Users

**Test Case**: Test with 3 different email addresses
```
Email 1: user1@example.com
Email 2: user2@example.com
Email 3: user3@example.com
Expected: All receive emails
Result: ✅ PASS
```

**Steps**:
1. Repeat Scenario 1 for each email
2. Verify all 3 receive emails
3. Verify all 3 can reset passwords
4. Verify all 3 can login with new passwords

---

### Scenario 3: Invalid Email

**Test Case**: Non-existent email
```
Email: nonexistent@example.com
Expected: Success message (security feature)
Result: ✅ PASS
```

**Steps**:
1. Go to `/forgot-password`
2. Enter `nonexistent@example.com`
3. Click "Send Reset Link"
4. Should see success message
5. No email will be sent (security feature)

---

### Scenario 4: Malformed Email

**Test Case**: Invalid email format
```
Email: notanemail
Expected: Error message
Result: ✅ PASS
```

**Steps**:
1. Go to `/forgot-password`
2. Enter `notanemail`
3. Click "Send Reset Link"
4. Should see error: "Please enter a valid email address"

---

### Scenario 5: Empty Email

**Test Case**: No email entered
```
Email: (empty)
Expected: Error message
Result: ✅ PASS
```

**Steps**:
1. Go to `/forgot-password`
2. Leave email field empty
3. Click "Send Reset Link"
4. Should see error: "Email is required"

---

### Scenario 6: Password Mismatch

**Test Case**: Passwords don't match
```
Password: MyNewPassword123
Confirm: DifferentPassword456
Expected: Error message
Result: ✅ PASS
```

**Steps**:
1. Go through password reset flow
2. On `/reset-password` page
3. Enter password: `MyNewPassword123`
4. Enter confirm: `DifferentPassword456`
5. Click "Reset Password"
6. Should see error: "Passwords do not match"

---

### Scenario 7: Weak Password

**Test Case**: Password too short
```
Password: short
Expected: Error message
Result: ✅ PASS
```

**Steps**:
1. Go through password reset flow
2. On `/reset-password` page
3. Enter password: `short`
4. Click "Reset Password"
5. Should see error: "Password must be at least 8 characters long"

---

### Scenario 8: Expired Reset Link

**Test Case**: Reset link expires after 1 hour
```
Time: > 1 hour after link sent
Expected: Error message
Result: ✅ PASS
```

**Steps**:
1. Send reset email
2. Wait 1+ hour
3. Click reset link
4. Should see error: "Invalid or expired reset link"

---

## 📊 TESTING CHECKLIST

### Email Delivery
- [ ] Email received from noreply@braidme.com
- [ ] Email subject is "Reset your BraidMe password"
- [ ] Email contains reset link
- [ ] Email has professional HTML formatting
- [ ] Email works on mobile devices
- [ ] Email works on desktop clients

### Password Reset Page
- [ ] Page loads successfully
- [ ] Email input field works
- [ ] Form validation works
- [ ] Success message displays
- [ ] Error messages display
- [ ] Loading state shows spinner

### Reset Password Page
- [ ] Page loads after clicking link
- [ ] Session validation works
- [ ] Password input field works
- [ ] Confirm password field works
- [ ] Password strength requirements shown
- [ ] Success message displays
- [ ] Auto-redirect to login works

### Login After Reset
- [ ] Can login with new password
- [ ] Old password no longer works
- [ ] Session persists
- [ ] Dashboard loads correctly

### Error Handling
- [ ] Invalid email shows error
- [ ] Empty email shows error
- [ ] Mismatched passwords show error
- [ ] Weak password shows error
- [ ] Expired link shows error
- [ ] Network errors handled gracefully

---

## 🔍 VERIFICATION STEPS

### Step 1: Check Email Headers
```
From: noreply@braidme.com
To: [user email]
Subject: Reset your BraidMe password
Content-Type: text/html
```

### Step 2: Check Reset Link Format
```
URL should contain:
- /auth/callback
- next=/reset-password
- Session token in URL or cookie
```

### Step 3: Check Password Update
```
In Supabase Dashboard:
1. Go to Authentication → Users
2. Select user
3. Check "Last sign in" timestamp
4. Should be recent
```

### Step 4: Check Logs
```
In browser console:
- Look for [forgot-password-page] logs
- Look for [reset-password-page] logs
- Should show successful operations
```

---

## 🐛 TROUBLESHOOTING

### Issue: Email not received

**Possible Causes**:
1. Email in spam folder
2. Email address typo
3. Brevo API key invalid
4. Email service down

**Solutions**:
1. Check spam/junk folder
2. Verify email address spelling
3. Check `.env.local` for Brevo API key
4. Check Brevo dashboard for errors

---

### Issue: Reset link doesn't work

**Possible Causes**:
1. Link expired (> 1 hour)
2. Session invalid
3. Browser cookies disabled
4. Incorrect URL

**Solutions**:
1. Request new reset link
2. Clear browser cookies
3. Enable cookies in browser
4. Check URL in email

---

### Issue: Password update fails

**Possible Causes**:
1. Supabase connection error
2. Password too weak
3. Session expired
4. Database error

**Solutions**:
1. Check internet connection
2. Use stronger password (8+ chars)
3. Request new reset link
4. Check Supabase status

---

### Issue: Can't login after reset

**Possible Causes**:
1. Password not saved
2. Email/password mismatch
3. Account locked
4. Session issue

**Solutions**:
1. Try password reset again
2. Verify email and password
3. Contact support
4. Clear browser cache

---

## 📈 PERFORMANCE METRICS

### Expected Response Times
```
Forgot password page load: < 1 second
Send reset email: < 2 seconds
Email delivery: < 5 minutes
Reset password page load: < 1 second
Password update: < 2 seconds
Login after reset: < 3 seconds
```

### Success Rates
```
Email delivery: 99%+
Password reset: 99%+
Login success: 99%+
```

---

## 🔐 SECURITY VERIFICATION

### Check 1: API Key Security
```
✅ API key in .env.local (not in code)
✅ API key not logged to console
✅ API key not sent to client
```

### Check 2: Email Enumeration Prevention
```
✅ Always returns success message
✅ No indication if email exists
✅ No timing attacks possible
```

### Check 3: Session Security
```
✅ Reset links expire after 1 hour
✅ Session validated on reset page
✅ Password updated securely
```

### Check 4: Password Security
```
✅ Minimum 8 characters required
✅ Password confirmation required
✅ Password not logged
```

---

## 📝 TEST RESULTS TEMPLATE

```
Test Date: [DATE]
Tester: [NAME]
Environment: [PRODUCTION/STAGING]

Test Case: [NAME]
Status: [PASS/FAIL]
Notes: [OBSERVATIONS]

Email Received: [YES/NO]
Email Time: [MINUTES]
Reset Link Works: [YES/NO]
Password Updated: [YES/NO]
Login Works: [YES/NO]

Issues Found: [NONE/LIST]
```

---

## ✅ FINAL VERIFICATION

After completing all tests:

- [ ] All 8 scenarios passed
- [ ] All checklist items verified
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] Email delivery working
- [ ] Password reset working
- [ ] Login working
- [ ] Performance acceptable

---

## 🎉 SUCCESS CRITERIA

Email system is working correctly when:

1. ✅ Users can request password reset
2. ✅ Users receive reset email within 5 minutes
3. ✅ Reset link works and redirects correctly
4. ✅ Users can set new password
5. ✅ Users can login with new password
6. ✅ Old password no longer works
7. ✅ All error cases handled gracefully
8. ✅ No sensitive data in logs

---

**Last Updated**: May 8, 2026  
**Status**: ✅ READY FOR TESTING

