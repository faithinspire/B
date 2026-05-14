# Resend Email Setup Guide

## Current Configuration

### Environment Variables (Already Set in `.env.local`)
```env
RESEND_API_KEY=re_RyzgBnkm_7CoApGqrM9NqjaT5uvtKPs5Y
RESEND_FROM_EMAIL=noreply@braidme.com
```

## Installation

### 1. Install Resend Package
```bash
npm install resend
```

### 2. Verify Installation
```bash
npm list resend
```

Should show: `resend@3.0.0` (or latest version)

## Email Module

### Location: `lib/resend.ts`
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions) {
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@braidme.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  
  return { success: true, messageId: result.data?.id };
}
```

## Usage Examples

### Send Welcome Email
```typescript
import { sendEmail } from '@/lib/resend';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to BraidMe!',
  html: '<h1>Welcome!</h1><p>Thanks for joining.</p>',
});
```

### Send Password Reset Email
```typescript
await sendEmail({
  to: 'user@example.com',
  subject: 'Reset Your Password',
  html: `<a href="${resetLink}">Click here to reset</a>`,
});
```

## Testing

### Test Email Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### Expected Response
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "result": {
    "to": "your-email@example.com",
    "subject": "BraidMe Email Service Test",
    "service": "Resend"
  }
}
```

## Vercel Deployment

### Add Environment Variables
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - Key: `RESEND_API_KEY`
   - Value: `re_RyzgBnkm_7CoApGqrM9NqjaT5uvtKPs5Y`
5. Add:
   - Key: `RESEND_FROM_EMAIL`
   - Value: `noreply@braidme.com`
6. Click "Save"
7. Vercel will auto-redeploy

### Verify Deployment
After deployment, test:
1. Sign up as new customer
2. Check email for welcome message
3. Test password reset flow
4. Verify emails arrive in inbox

## Email Features

### 1. Welcome Emails
- **Trigger**: User signup
- **Recipients**: Customers and Braiders
- **Content**: Personalized welcome message with next steps

### 2. Password Reset
- **Trigger**: Forgot password request
- **Recipients**: User email
- **Content**: Reset link (expires in 24 hours)

### 3. SOS Alerts
- **Trigger**: Customer clicks SOS during booking
- **Recipients**: Support team
- **Content**: Emergency alert with booking details

### 4. Dispute Notifications
- **Trigger**: Customer creates dispute
- **Recipients**: Support team
- **Content**: Dispute details and resolution options

## Resend Dashboard

### Access Your Account
- **URL**: https://resend.com
- **API Key**: `re_RyzgBnkm_7CoApGqrM9NqjaT5uvtKPs5Y`

### Monitor Emails
1. Go to Resend Dashboard
2. View email delivery logs
3. Check bounce rates
4. Monitor open rates

## Troubleshooting

### Issue: "RESEND_API_KEY not configured"
**Solution**: 
- Check `.env.local` has `RESEND_API_KEY` set
- Restart dev server: `npm run dev`
- Verify key is correct

### Issue: "Invalid from email"
**Solution**:
- Ensure `RESEND_FROM_EMAIL=noreply@braidme.com`
- Domain must be verified in Resend (already done)

### Issue: "Email not received"
**Solution**:
1. Check Resend dashboard for delivery status
2. Check spam/junk folder
3. Verify recipient email is correct
4. Check email content for spam triggers

### Issue: "Build error: Cannot find module 'resend'"
**Solution**:
```bash
npm install resend
npm run build
```

## API Reference

### sendEmail Function
```typescript
interface EmailOptions {
  to: string;           // Recipient email
  subject: string;      // Email subject
  html: string;         // HTML content
  text?: string;        // Plain text (optional)
}

async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}>
```

## Rate Limits

- **Free Plan**: 100 emails/day
- **Pro Plan**: Unlimited emails
- **Burst Limit**: 50 emails/second

Current plan supports all BraidMe email needs.

## Security

### API Key Protection
- ✅ Never commit API key to git
- ✅ Use environment variables only
- ✅ Rotate key if compromised
- ✅ Use different keys for dev/prod

### Email Validation
- ✅ Validate email format before sending
- ✅ Check for bounce addresses
- ✅ Monitor delivery failures

## Support

### Resend Documentation
- **Docs**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference
- **Status**: https://status.resend.com

### BraidMe Support
- Check logs: `npm run dev` (local)
- Check Vercel logs: https://vercel.com/dashboard
- Check Resend dashboard for delivery status

## Migration Checklist

- [x] Install Resend package
- [x] Create `lib/resend.ts` module
- [x] Update all email routes
- [x] Update environment variables
- [x] Test locally
- [ ] Deploy to Vercel
- [ ] Add Vercel environment variables
- [ ] Test in production
- [ ] Monitor email delivery

## Next Steps

1. **Install**: `npm install`
2. **Test**: `npm run dev` and test email endpoint
3. **Deploy**: Push to git and deploy to Vercel
4. **Configure**: Add environment variables to Vercel
5. **Verify**: Test signup and password reset flows

---

**Status**: Ready for deployment
**API Key**: Active
**From Email**: Verified
**Support**: Available 24/7
