# IMMEDIATE FIX: Password Reset Email Service on Vercel

## THE PROBLEM
Password reset returns "Email service is not properly configured" on Vercel because Brevo environment variables are missing.

## THE SOLUTION (5 MINUTES)

### STEP 1: Open Vercel Project Settings
```
1. Go to: https://vercel.com/dashboard
2. Click: BraidMe project
3. Click: Settings (top menu)
4. Click: Environment Variables (left sidebar)
```

### STEP 2: Add BREVO_API_KEY
```
Name:  BREVO_API_KEY
Value: [Get from .env.local - starts with xkeysib-]
Environments: ✅ Production ✅ Preview ✅ Development
Click: Add
```

### STEP 3: Add BREVO_FROM_EMAIL
```
Name:  BREVO_FROM_EMAIL
Value: noreply@braidme.com
Environments: ✅ Production ✅ Preview ✅ Development
Click: Add
```

### STEP 4: Add BREVO_FROM_NAME
```
Name:  BREVO_FROM_NAME
Value: BraidMe
Environments: ✅ Production ✅ Preview ✅ Development
Click: Add
```

### STEP 5: Redeploy
```
1. Go to: Deployments tab
2. Find: Latest deployment
3. Click: ⋮ (three dots)
4. Click: Redeploy
5. Wait: 2-3 minutes
```

### STEP 6: Test
```
1. Go to: https://braidme.com/forgot-password
2. Enter: Any email
3. Click: Send Reset Link
4. Expected: "Password reset link sent to your email"
```

---

## WHERE TO GET THE BREVO_API_KEY

Open `.env.local` in your project:
```
Look for: BREVO_API_KEY=xkeysib-...
Copy the entire value after the = sign
Paste into Vercel
```

---

## VERIFICATION

After redeploy, check Vercel logs:
```
1. Deployments tab
2. Click latest deployment
3. Click Logs
4. Search: [Password Reset]
5. Should see: ✅ Email sent successfully
```

---

## IF IT STILL DOESN'T WORK

1. **Verify variables saved**: Refresh Vercel settings page
2. **Check environment**: Make sure Production is selected
3. **Redeploy again**: Click redeploy button
4. **Wait**: Give it 3 minutes
5. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
6. **Check logs**: Look for error messages in Vercel logs

---

## WHAT'S HAPPENING

When you request a password reset:

```
1. Frontend sends email to /api/auth/password-reset/request
2. Backend checks if BREVO_API_KEY exists
3. If missing → returns "Email service is not properly configured"
4. If exists → generates token and sends email via Brevo
5. User receives email with reset link
6. User clicks link and resets password
```

The code is working perfectly. It just needs the environment variables in Vercel.

---

## DONE!

Once you complete these 6 steps, password reset emails will work on production.

**Time**: 5 minutes
**Difficulty**: Easy
**Impact**: Password reset fully functional
