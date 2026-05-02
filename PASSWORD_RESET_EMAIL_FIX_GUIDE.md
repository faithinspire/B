# Password Reset Email Fix - Resend API Integration

## Problem Identified
The password reset emails were not being sent because the `forgot-password` endpoint was using a raw `fetch` call to Resend API instead of the proper Resend SDK. This caused:
1. No error handling for API responses
2. Incorrect email format (array instead of string)
3. No validation of the response

## Solution Applied
Updated `app/api/auth/forgot-password/route.ts` to:
1. Use the official Resend SDK (`import('resend')`)
2. Properly handle API responses and errors
3. Add comprehensive logging for debugging
4. Properly await the async Resend call

## Key Changes

### Before (Broken)
```typescript
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: `BraidMe <${fromEmail}>`,
    to: [email],  // ❌ Wrong format - should be string
    subject: 'Reset your BraidMe password',
    html: `...`,
  }),
});
```

### After (Fixed)
```typescript
const { Resend } = await import('resend');
const resend = new Resend(apiKey);

const result = await resend.emails.send({
  from: `BraidMe <${fromEmail}>`,
  to: email,  // ✅ Correct format - string
  subject: 'Reset your BraidMe password',
  html: `...`,
});

if (result.error) {
  console.error('[forgot-password] Resend API error:', result.error);
  throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
}
```

## Testing the Fix

### Step 1: Test Email Service (Optional)
First, verify Resend is working with a test email:

```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "result": {
    "id": "email_xxx",
    "from": "noreply@braidme.com",
    "to": "your-test-email@example.com",
    "subject": "BraidMe Email Service Test"
  }
}
```

### Step 2: Test Password Reset Flow

1. Go to your login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email inbox (and spam folder)
5. You should receive a password reset email with a clickable button

### Step 3: Verify in Logs
Check your server logs for these messages:

```
[forgot-password] email: user@example.com | redirectTo: https://braidmee.vercel.app/auth/callback?next=/reset-password
[forgot-password] Resend email sent successfully to: user@example.com ID: email_xxx
```

## Environment Variables Required

Make sure these are set in `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY=re_Zv55Uj22_5AUkTg33pAeZn7dja45XBGer
RESEND_FROM_EMAIL=noreply@braidme.com

# App URL (for reset link)
NEXT_PUBLIC_APP_URL=https://braidmee.vercel.app
```

## Troubleshooting

### Issue: "RESEND_API_KEY not configured"
- Check `.env.local` has `RESEND_API_KEY` set
- Restart your dev server after updating `.env.local`

### Issue: "RESEND_API_KEY is a placeholder"
- Replace the placeholder key with your actual Resend API key from https://resend.com

### Issue: Email not received
1. Check spam/junk folder
2. Verify the email address is correct
3. Check server logs for errors
4. Test with `/api/auth/test-email` endpoint first

### Issue: "Resend error: invalid_from_address"
- Verify `RESEND_FROM_EMAIL` is a verified sender in Resend dashboard
- Default is `noreply@braidme.com` - make sure this is verified

### Issue: "Resend error: invalid_to_address"
- The email address format is invalid
- Check that the email being sent to is a valid email format

## Resend Dashboard

To verify your setup:
1. Go to https://resend.com/dashboard
2. Check "Emails" section to see sent emails
3. Verify sender domain is configured
4. Check API key is active

## Files Modified
- `app/api/auth/forgot-password/route.ts` - Fixed Resend SDK usage and error handling

## Next Steps
1. Test the password reset flow end-to-end
2. Monitor logs for any errors
3. If issues persist, check Resend dashboard for delivery status
4. Consider adding email templates to Resend for better management
