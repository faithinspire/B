# 🚀 IMMEDIATE SETUP STEPS - PASSWORD RESET SYSTEM

## ⏱️ TIME REQUIRED: ~20 MINUTES

Follow these exact steps to get the password reset system working.

---

## STEP 1: CONFIGURE SUPABASE SMTP (5 MINUTES)

### 1.1 Go to Supabase Dashboard
```
1. Open https://app.supabase.com
2. Select your project
3. Click "Project Settings" (gear icon)
4. Go to "Auth" section
5. Click "SMTP Settings"
```

### 1.2 Enter Brevo SMTP Credentials
```
Fill in these exact values:

SMTP Host:
smtp-relay.brevo.com

SMTP Port:
587

SMTP Username:
[Your Brevo account email - the one you registered with]

SMTP Password:
[Your Brevo SMTP Key - NOT your API key]

Sender Name:
BraidMe

Sender Email:
noreply@braidme.com
```

### 1.3 How to Get Your Brevo SMTP Key
```
1. Go to https://app.brevo.com
2. Click "Settings" (gear icon)
3. Click "SMTP & API"
4. Under "SMTP" section, you'll see your SMTP Key
5. Copy it and paste into Supabase SMTP Password field
```

### 1.4 Save Settings
```
Click "Save" button in Supabase
```

---

## STEP 2: ADD REDIRECT URLS (3 MINUTES)

### 2.1 Go to URL Configuration
```
1. In Supabase, go to "Project Settings"
2. Go to "Auth" section
3. Click "URL Configuration"
4. Find "Redirect URLs" section
```

### 2.2 Add Production URLs
```
Click "Add URL" and enter:
https://braidmee.vercel.app/auth/callback

Click "Add URL" again and enter:
https://braidmee.vercel.app/update-password
```

### 2.3 Add Local Development URLs
```
Click "Add URL" and enter:
http://localhost:3000/auth/callback

Click "Add URL" again and enter:
http://localhost:3000/update-password
```

### 2.4 Save Settings
```
Click "Save" button
```

---

## STEP 3: UPDATE EMAIL TEMPLATE (2 MINUTES)

### 3.1 Go to Email Templates
```
1. In Supabase, go to "Project Settings"
2. Go to "Auth" section
3. Click "Email Templates"
4. Find "Reset Password" template
5. Click on it to edit
```

### 3.2 Update Template
```
Replace the entire template with this:

---START---
<h2>Reset your password</h2>

<p>Follow this link to reset your BraidMe password:</p>

<p>
  <a href="{{ .ConfirmationURL }}">Reset Password</a>
</p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request this, you can safely ignore this email.</p>
---END---
```

### 3.3 Important Notes
```
✅ MUST include: {{ .ConfirmationURL }}
✅ This variable contains the reset link
✅ The link will automatically include the recovery token
✅ The link will redirect to /update-password
```

### 3.4 Save Template
```
Click "Save" button
```

---

## STEP 4: QUICK TEST (5 MINUTES)

### 4.1 Test Forgot Password Page
```
1. Go to https://braidmee.vercel.app/forgot-password
2. Enter your email address
3. Click "Send Reset Link"
4. You should see: "Check your email"
```

### 4.2 Check Email
```
1. Go to your email inbox
2. Look for email from: noreply@braidme.com
3. Subject should be: "Reset your BraidMe password"
4. Email should arrive within 2 minutes
```

### 4.3 Click Reset Link
```
1. Open the email
2. Click "Reset Password" button
3. You should be redirected to /update-password page
4. Page should show password form
```

### 4.4 Reset Password
```
1. Enter new password (8+ characters)
2. Confirm password (must match)
3. Click "Reset Password"
4. You should see: "Password reset successful!"
5. You should be redirected to login page
```

### 4.5 Login with New Password
```
1. On login page, enter your email
2. Enter the new password you just set
3. Click "Login"
4. You should be logged in successfully
```

---

## STEP 5: FULL TESTING (10 MINUTES - OPTIONAL)

### 5.1 Test with Multiple Emails
```
Repeat steps 4.1-4.5 with 3 different email addresses:
- test1@example.com
- test2@example.com
- test3@example.com
```

### 5.2 Test on Mobile
```
1. Open https://braidmee.vercel.app/forgot-password on mobile
2. Test the complete flow
3. Verify responsive design
```

### 5.3 Test Error Cases
```
1. Try invalid email: "notanemail"
   → Should show error
   
2. Try empty email: (leave blank)
   → Should show error
   
3. Try short password: "short"
   → Should show error
   
4. Try mismatched passwords: "Password123" vs "Password456"
   → Should show error
```

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

- [ ] Supabase SMTP settings saved
- [ ] All 4 redirect URLs added
- [ ] Email template updated
- [ ] Forgot password page loads
- [ ] Email sends successfully
- [ ] Email contains reset link
- [ ] Reset link works
- [ ] Password update works
- [ ] Login with new password works
- [ ] Old password no longer works

---

## 🆘 TROUBLESHOOTING

### Email Not Arriving
```
1. Check spam/junk folder
2. Verify Brevo SMTP credentials are correct
3. Check Brevo account for sending limits
4. Verify sender email (noreply@braidme.com) is verified in Brevo
5. Check Supabase logs for errors
```

### Reset Link Not Working
```
1. Verify redirect URL is in Supabase settings
2. Check if link is expired (1 hour limit)
3. Verify URL format is correct
4. Check browser console (F12) for errors
```

### Password Update Failing
```
1. Verify password is 8+ characters
2. Check if passwords match
3. Verify Supabase connection
4. Check browser console (F12) for errors
```

---

## 📞 SUPPORT RESOURCES

- **Setup Guide**: SUPABASE_BREVO_PASSWORD_RESET_COMPLETE_SETUP.md
- **Testing Guide**: PASSWORD_RESET_TESTING_GUIDE.md
- **Quick Reference**: PASSWORD_RESET_QUICK_REFERENCE.md
- **Implementation**: PASSWORD_RESET_IMPLEMENTATION_SUMMARY.md

---

## 🎯 SUMMARY

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Configure Supabase SMTP | 5 min | ⏳ Do Now |
| 2 | Add Redirect URLs | 3 min | ⏳ Do Now |
| 3 | Update Email Template | 2 min | ⏳ Do Now |
| 4 | Quick Test | 5 min | ⏳ Do Now |
| 5 | Full Testing | 10 min | ✅ Optional |

**Total Time**: ~20 minutes

---

## 🚀 YOU'RE READY!

Once you complete these steps, the password reset system will be fully functional and ready for production use.

**Current Status**: ✅ Code deployed to Vercel
**Next Status**: ⏳ Waiting for your configuration
**Final Status**: 🎉 Production ready

---

**Start Now**: Go to https://app.supabase.com and follow Step 1
