# 🧪 PASSWORD RESET - COMPREHENSIVE TESTING GUIDE

## Pre-Testing Verification

Before running tests, verify everything is configured:

### ✅ Supabase Configuration
```
1. Go to https://app.supabase.com
2. Select your project
3. Go to Project Settings → Auth → SMTP Settings
4. Verify:
   - Host: smtp-relay.brevo.com
   - Port: 587
   - Username: your_brevo_email
   - Password: your_brevo_smtp_key
   - Sender Name: BraidMe
   - Sender Email: noreply@braidme.com
```

### ✅ Redirect URLs
```
1. Go to Project Settings → Auth → URL Configuration
2. Verify these URLs are added:
   - https://braidmee.vercel.app/auth/callback
   - https://braidmee.vercel.app/update-password
   - http://localhost:3000/auth/callback
   - http://localhost:3000/update-password
```

### ✅ Email Template
```
1. Go to Project Settings → Auth → Email Templates → Reset Password
2. Verify template contains {{ .ConfirmationURL }}
3. Verify template is professional and clear
```

### ✅ Frontend Files
```
1. Verify app/(public)/forgot-password/page.tsx exists
2. Verify app/(public)/update-password/page.tsx exists
3. Verify both files use supabase from @/lib/supabase
```

### ✅ Environment Variables
```
1. Check .env.local has:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_APP_URL
```

---

## DEVELOPMENT TESTING (Local)

### Test Suite 1: Page Loading

#### Test 1.1: Forgot Password Page Loads
```
Steps:
1. Start dev server: npm run dev
2. Go to http://localhost:3000/forgot-password
3. Verify page loads without errors
4. Verify page title is "Reset Password"
5. Verify email input field is visible
6. Verify "Send Reset Link" button is visible
7. Verify "Back to Login" link is visible

Expected Result: ✅ Page loads with all elements visible
```

#### Test 1.2: Update Password Page Loads (Without Token)
```
Steps:
1. Go to http://localhost:3000/update-password
2. Wait for validation to complete
3. Verify error message appears
4. Verify "Request New Reset Link" button is visible

Expected Result: ✅ Error page shown with helpful message
```

---

### Test Suite 2: Email Sending

#### Test 2.1: Send Reset Email
```
Steps:
1. Go to http://localhost:3000/forgot-password
2. Enter a valid email address (use a test email you can access)
3. Click "Send Reset Link"
4. Verify loading state appears
5. Wait 2-3 seconds
6. Verify success message appears: "Check your email"
7. Verify email input is cleared
8. Check your email inbox

Expected Result: ✅ Email arrives within 2 minutes
```

#### Test 2.2: Verify Email Content
```
Steps:
1. Open the email you received
2. Verify sender is: noreply@braidme.com
3. Verify subject contains: "Reset your password"
4. Verify email body contains:
   - "Reset your password" heading
   - "Reset Password" button/link
   - Full URL in plain text
   - "This link will expire in 1 hour"
5. Verify reset link URL format:
   - Contains: http://localhost:3000/update-password
   - Contains: #type=recovery
   - Contains: access_token parameter

Expected Result: ✅ Email is professional and contains valid reset link
```

#### Test 2.3: Send Multiple Emails
```
Steps:
1. Go to /forgot-password
2. Send reset email to test1@example.com
3. Verify success message
4. Click "Try Another Email"
5. Send reset email to test2@example.com
6. Verify success message
7. Send reset email to test3@example.com
8. Verify success message

Expected Result: ✅ All 3 emails sent successfully
```

---

### Test Suite 3: Reset Link Validation

#### Test 3.1: Click Reset Link
```
Steps:
1. Open email from noreply@braidme.com
2. Click "Reset Password" button in email
3. Wait for page to load
4. Verify redirected to /update-password
5. Verify page shows password form
6. Verify "Create New Password" heading is visible
7. Verify password input fields are visible
8. Verify "Reset Password" button is visible

Expected Result: ✅ Reset link works and page loads correctly
```

#### Test 3.2: Validate Session
```
Steps:
1. After clicking reset link, check browser console (F12)
2. Verify no errors in console
3. Verify page shows password form (not error)
4. Verify form is interactive

Expected Result: ✅ Session is valid and form is ready
```

---

### Test Suite 4: Password Update

#### Test 4.1: Update Password Successfully
```
Steps:
1. On /update-password page with valid reset link
2. Enter new password: "NewPassword123!"
3. Confirm password: "NewPassword123!"
4. Click "Reset Password"
5. Verify loading state appears
6. Wait 2-3 seconds
7. Verify success message appears: "Password reset successful!"
8. Verify redirected to /login page

Expected Result: ✅ Password updated and redirected to login
```

#### Test 4.2: Password Too Short
```
Steps:
1. On /update-password page with valid reset link
2. Enter password: "Short1"
3. Confirm password: "Short1"
4. Click "Reset Password"
5. Verify error message: "Password must be at least 8 characters long"
6. Verify form is still visible
7. Verify can try again

Expected Result: ✅ Validation error shown, form remains
```

#### Test 4.3: Passwords Don't Match
```
Steps:
1. On /update-password page with valid reset link
2. Enter password: "Password123!"
3. Confirm password: "Password456!"
4. Click "Reset Password"
5. Verify error message: "Passwords do not match"
6. Verify form is still visible
7. Verify can try again

Expected Result: ✅ Validation error shown, form remains
```

#### Test 4.4: Empty Password
```
Steps:
1. On /update-password page with valid reset link
2. Leave password fields empty
3. Click "Reset Password"
4. Verify error message: "Password is required"
5. Verify form is still visible

Expected Result: ✅ Validation error shown
```

---

### Test Suite 5: Login with New Password

#### Test 5.1: Login After Password Reset
```
Steps:
1. After successful password reset, on /login page
2. Enter email: (the email you reset password for)
3. Enter password: (the new password you set)
4. Click "Login"
5. Verify loading state appears
6. Wait 2-3 seconds
7. Verify login succeeds
8. Verify redirected to dashboard

Expected Result: ✅ Login successful with new password
```

#### Test 5.2: Old Password Doesn't Work
```
Steps:
1. On /login page
2. Enter email: (the email you reset password for)
3. Enter password: (the old password before reset)
4. Click "Login"
5. Verify login fails
6. Verify error message appears

Expected Result: ✅ Old password rejected
```

---

### Test Suite 6: Edge Cases

#### Test 6.1: Expired Reset Link
```
Steps:
1. Request password reset
2. Wait 1+ hour (or manually expire in Supabase)
3. Click reset link in email
4. Verify error message: "Invalid or expired reset link"
5. Verify "Request New Reset Link" button is visible
6. Click button
7. Verify redirected to /forgot-password

Expected Result: ✅ Expired link handled gracefully
```

#### Test 6.2: Direct Access to Update Password
```
Steps:
1. Go directly to http://localhost:3000/update-password
2. Without clicking any reset link
3. Wait for validation
4. Verify error message appears
5. Verify "Request New Reset Link" button is visible

Expected Result: ✅ Invalid access prevented
```

#### Test 6.3: Invalid Email Format
```
Steps:
1. Go to /forgot-password
2. Enter invalid email: "notanemail"
3. Click "Send Reset Link"
4. Verify error message: "Please enter a valid email address"
5. Verify form is still visible

Expected Result: ✅ Invalid email rejected
```

#### Test 6.4: Empty Email
```
Steps:
1. Go to /forgot-password
2. Leave email field empty
3. Click "Send Reset Link"
4. Verify error message: "Email is required"
5. Verify form is still visible

Expected Result: ✅ Empty email rejected
```

#### Test 6.5: Network Error Handling
```
Steps:
1. Go to /forgot-password
2. Disconnect internet (or use DevTools to throttle)
3. Enter email
4. Click "Send Reset Link"
5. Verify error message appears
6. Reconnect internet
7. Try again
8. Verify email sends successfully

Expected Result: ✅ Network errors handled gracefully
```

---

## PRODUCTION TESTING (After Deployment)

### Test Suite 7: Production URLs

#### Test 7.1: Production Forgot Password Page
```
Steps:
1. Go to https://braidmee.vercel.app/forgot-password
2. Verify page loads
3. Verify styling is correct
4. Verify all elements are visible
5. Verify page is responsive on mobile

Expected Result: ✅ Production page loads correctly
```

#### Test 7.2: Production Update Password Page
```
Steps:
1. Go to https://braidmee.vercel.app/update-password
2. Verify page loads
3. Verify error message appears (no valid token)
4. Verify styling is correct
5. Verify page is responsive on mobile

Expected Result: ✅ Production page loads correctly
```

---

### Test Suite 8: Production Email Delivery

#### Test 8.1: Send Production Email
```
Steps:
1. Go to https://braidmee.vercel.app/forgot-password
2. Enter a valid email address
3. Click "Send Reset Link"
4. Verify success message
5. Check email inbox
6. Verify email arrives within 2 minutes
7. Verify email is from noreply@braidme.com
8. Verify reset link uses production URL

Expected Result: ✅ Email delivered to production
```

#### Test 8.2: Production Reset Link
```
Steps:
1. Open email from noreply@braidme.com
2. Click "Reset Password" button
3. Verify redirected to https://braidmee.vercel.app/update-password
4. Verify page loads with password form
5. Verify no errors in console

Expected Result: ✅ Production reset link works
```

---

### Test Suite 9: Production Full Flow

#### Test 9.1: Complete Password Reset Flow
```
Steps:
1. Go to https://braidmee.vercel.app/forgot-password
2. Enter email: test1@example.com
3. Click "Send Reset Link"
4. Verify success message
5. Check email inbox
6. Click reset link in email
7. Enter new password: "ProductionTest123!"
8. Confirm password: "ProductionTest123!"
9. Click "Reset Password"
10. Verify success message
11. Verify redirected to login
12. Enter email: test1@example.com
13. Enter password: "ProductionTest123!"
14. Click "Login"
15. Verify login succeeds
16. Verify redirected to dashboard

Expected Result: ✅ Complete flow works in production
```

#### Test 9.2: Multiple Users Production
```
Steps:
Repeat Test 9.1 with 3 different email addresses:
- test1@example.com
- test2@example.com
- test3@example.com

Expected Result: ✅ All 3 users can reset passwords
```

---

## Test Results Template

### Development Testing Results
```
Date: _______________
Tester: _______________
Environment: Local (http://localhost:3000)

Test Suite 1: Page Loading
- Test 1.1: ☐ PASS ☐ FAIL
- Test 1.2: ☐ PASS ☐ FAIL

Test Suite 2: Email Sending
- Test 2.1: ☐ PASS ☐ FAIL
- Test 2.2: ☐ PASS ☐ FAIL
- Test 2.3: ☐ PASS ☐ FAIL

Test Suite 3: Reset Link Validation
- Test 3.1: ☐ PASS ☐ FAIL
- Test 3.2: ☐ PASS ☐ FAIL

Test Suite 4: Password Update
- Test 4.1: ☐ PASS ☐ FAIL
- Test 4.2: ☐ PASS ☐ FAIL
- Test 4.3: ☐ PASS ☐ FAIL
- Test 4.4: ☐ PASS ☐ FAIL

Test Suite 5: Login with New Password
- Test 5.1: ☐ PASS ☐ FAIL
- Test 5.2: ☐ PASS ☐ FAIL

Test Suite 6: Edge Cases
- Test 6.1: ☐ PASS ☐ FAIL
- Test 6.2: ☐ PASS ☐ FAIL
- Test 6.3: ☐ PASS ☐ FAIL
- Test 6.4: ☐ PASS ☐ FAIL
- Test 6.5: ☐ PASS ☐ FAIL

Overall Result: ☐ ALL PASS ☐ SOME FAILURES
```

### Production Testing Results
```
Date: _______________
Tester: _______________
Environment: Production (https://braidmee.vercel.app)

Test Suite 7: Production URLs
- Test 7.1: ☐ PASS ☐ FAIL
- Test 7.2: ☐ PASS ☐ FAIL

Test Suite 8: Production Email Delivery
- Test 8.1: ☐ PASS ☐ FAIL
- Test 8.2: ☐ PASS ☐ FAIL

Test Suite 9: Production Full Flow
- Test 9.1: ☐ PASS ☐ FAIL
- Test 9.2: ☐ PASS ☐ FAIL

Overall Result: ☐ ALL PASS ☐ SOME FAILURES
```

---

## Troubleshooting During Testing

### Email Not Arriving
```
1. Check spam/junk folder
2. Verify Brevo SMTP credentials in Supabase
3. Check Brevo account for sending limits
4. Verify sender email is verified in Brevo
5. Check Supabase logs for errors
6. Try with different email address
```

### Reset Link Not Working
```
1. Verify redirect URL is in Supabase settings
2. Check if link is expired (1 hour limit)
3. Verify URL format is correct
4. Check browser console (F12) for errors
5. Try clicking link again
```

### Password Update Failing
```
1. Verify password is 8+ characters
2. Check if passwords match
3. Verify Supabase connection
4. Check browser console (F12) for errors
5. Try with different password
```

### Login Failing After Reset
```
1. Verify you're using the new password
2. Verify email address is correct
3. Check if account exists
4. Try password reset again
5. Check browser console for errors
```

---

## Sign-Off

When all tests pass:

```
✅ Development Testing: COMPLETE
✅ Production Testing: COMPLETE
✅ All Edge Cases: HANDLED
✅ Email Delivery: VERIFIED
✅ Password Reset: WORKING
✅ System: PRODUCTION READY

Tested by: _______________
Date: _______________
Approved by: _______________
```

