# Email Debugging Guide - Forgot Password Not Sending

## Quick Test Steps

### Step 1: Test Email Service Directly
Use this curl command to test if Resend is working:

```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

Or on production:
```bash
curl -X POST https://braidmee.vercel.app/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### Step 2: Check Response
You should get a response like:
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "result": {
    "id": "email_id_here",
    "from": "noreply@braidme.com",
    "to": "your-email@gmail.com",
    "subject": "BraidMe Email Service Test"
  }
}
```

### Step 3: Check Your Email
- Check your inbox for the test email
- Check spam/junk folder
- Wait up to 2 minutes for delivery

---

## Common Issues & Solutions

### Issue 1: "RESEND_API_KEY not configured"
**Problem:** Environment variable not set

**Solution:**
1. Check `.env.local` file
2. Verify `RESEND_API_KEY=re_...` is present
3. Restart the development server
4. For production, check Vercel environment variables

**Verification:**
```bash
# Check if key exists
grep RESEND_API_KEY .env.local
```

### Issue 2: "RESEND_API_KEY is a placeholder"
**Problem:** API key contains placeholder text

**Solution:**
1. Go to https://resend.com
2. Get a real API key
3. Update `.env.local`:
   ```env
   RESEND_API_KEY=re_your_actual_key_here
   ```
4. Restart server

### Issue 3: Email arrives but reset link doesn't work
**Problem:** Reset URL is incorrect

**Solution:**
1. Check the email for the reset link
2. Verify it starts with `https://braidmee.vercel.app` (production) or `http://localhost:3000` (dev)
3. Check `.env.local` for `NEXT_PUBLIC_APP_URL`

### Issue 4: Email never arrives
**Problem:** Resend API is rejecting the request

**Solution:**
1. Check browser console for error messages
2. Check server logs for "[forgot-password]" messages
3. Verify email address is valid
4. Check Resend dashboard for failed emails
5. Verify `RESEND_FROM_EMAIL` is set correctly

---

## Debugging Steps

### Step 1: Enable Detailed Logging
The forgot-password endpoint logs everything. Check:
1. Browser DevTools Console (F12)
2. Server terminal output
3. Look for messages starting with `[forgot-password]`

### Step 2: Check Environment Variables
```bash
# Verify all email settings
echo "RESEND_API_KEY: $RESEND_API_KEY"
echo "RESEND_FROM_EMAIL: $RESEND_FROM_EMAIL"
echo "NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"
```

### Step 3: Test Resend API Directly
Create a test file `test-resend.js`:
```javascript
import { Resend } from 'resend';

const resend = new Resend('re_your_api_key_here');

const result = await resend.emails.send({
  from: 'noreply@braidme.com',
  to: 'your-email@gmail.com',
  subject: 'Test Email',
  html: '<h1>Test</h1>',
});

console.log(result);
```

Run it:
```bash
node --loader tsx test-resend.js
```

### Step 4: Check Resend Dashboard
1. Go to https://resend.com/emails
2. Look for recent emails
3. Check if they show as "Sent" or "Failed"
4. Click on failed emails to see error details

---

## Email Flow Diagram

```
User clicks "Forgot Password"
    ↓
Enters email address
    ↓
POST /api/auth/forgot-password
    ↓
Validate email format
    ↓
Check RESEND_API_KEY
    ↓
Try Resend API (PRIMARY)
    ├─ Success → Email sent ✅
    └─ Failure → Try Supabase (FALLBACK)
        ├─ Success → Email sent ✅
        └─ Failure → Return error (but still show success message)
    ↓
Return success response
    ↓
User checks email
```

---

## Environment Configuration

### Required Variables
```env
# Email Service
RESEND_API_KEY=re_your_actual_key_here
RESEND_FROM_EMAIL=noreply@braidme.com

# App URL (for reset links)
NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
```

### Verification Checklist
- [ ] RESEND_API_KEY starts with `re_`
- [ ] RESEND_API_KEY is not a placeholder
- [ ] RESEND_FROM_EMAIL is a valid email
- [ ] NEXT_PUBLIC_APP_URL is correct
- [ ] All variables are in `.env.local`
- [ ] Server restarted after changes

---

## Testing Checklist

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Test email endpoint: `POST /api/auth/test-email`
- [ ] Check console for logs
- [ ] Check email inbox
- [ ] Test forgot password flow
- [ ] Verify reset link works

### Production Testing
- [ ] Check Vercel environment variables
- [ ] Test email endpoint on production
- [ ] Check email inbox
- [ ] Test forgot password flow
- [ ] Verify reset link works

---

## Resend API Key Setup

### Getting a Resend API Key
1. Go to https://resend.com
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `re_`)
6. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your_key_here
   ```

### Verifying the Key Works
1. Go to https://resend.com/emails
2. Send a test email from the dashboard
3. Verify it arrives in your inbox
4. If it works there, it should work in the app

---

## Common Error Messages

### "Invalid Resend API key"
- API key is too short or empty
- Check `.env.local` for typos
- Verify key starts with `re_`

### "Resend error: Invalid from address"
- `RESEND_FROM_EMAIL` is not a valid email
- Check for typos in `.env.local`
- Verify email format is correct

### "Resend error: Invalid to address"
- User entered invalid email
- Check email validation in form
- Verify email format is correct

### "Resend error: Unauthorized"
- API key is invalid or expired
- Get a new key from Resend dashboard
- Update `.env.local`

---

## Next Steps

1. **Test the email service:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@gmail.com"}'
   ```

2. **Check the response** for success or error

3. **Check your email** for the test message

4. **If test works**, test forgot password flow

5. **If test fails**, follow debugging steps above

---

## Support

If emails still aren't sending:
1. Check all environment variables
2. Verify Resend API key is valid
3. Check Resend dashboard for failed emails
4. Check browser console for error messages
5. Check server logs for "[forgot-password]" messages
