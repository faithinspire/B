# Brevo Email System Diagnostic Guide

## Quick Diagnosis Checklist

### 1. Verify Brevo Account Status
- [ ] Log into https://app.brevo.com
- [ ] Check account is active (not suspended)
- [ ] Check account has email sending enabled
- [ ] Check account has credits/quota remaining

### 2. Verify API Key
- [ ] Go to Settings → SMTP & API
- [ ] Check if API key exists
- [ ] Verify key format starts with `xsmtpsib-`
- [ ] Check key hasn't been revoked
- [ ] Check key hasn't expired
- [ ] **Current key in code**: `xsmtpsib-54496d9e530d514faaeee82df32b1de2e44151778e69476f867e25c2ba5c7ae1`

### 3. Verify Sender Email
- [ ] Go to Senders & Domains
- [ ] Check if `noreply@braidme.com` is listed
- [ ] Verify it's marked as "Verified" (not pending)
- [ ] Check if it's the default sender
- [ ] If not verified, complete verification process

### 4. Test Email Sending
- [ ] Use Brevo's test email feature
- [ ] Send test email to your personal email
- [ ] Check if it arrives in inbox (not spam)

### 5. Check Email Logs
- [ ] Go to Transactional → Logs
- [ ] Look for recent email attempts
- [ ] Check for any error messages
- [ ] Verify if emails are being sent or rejected

## Common Issues & Solutions

### Issue: "Key not found" (401 Unauthorized)
**Cause**: API key is invalid, expired, or revoked
**Solution**: 
1. Generate new API key in Brevo dashboard
2. Update `.env.local` with new key
3. Redeploy application

### Issue: "Sender email not verified"
**Cause**: Sender email hasn't been verified in Brevo
**Solution**:
1. Go to Senders & Domains in Brevo
2. Add `noreply@braidme.com` if not present
3. Complete verification (check email for verification link)
4. Wait for verification to complete

### Issue: "Account suspended"
**Cause**: Brevo account has been suspended
**Solution**:
1. Check Brevo account status
2. Contact Brevo support if suspended
3. Consider alternative email service (SendGrid, Mailgun, etc.)

### Issue: "Rate limit exceeded"
**Cause**: Too many emails sent in short time
**Solution**:
1. Check Brevo account quota
2. Upgrade plan if needed
3. Implement rate limiting in application

## What to Do Right Now

1. **Check Brevo Dashboard**:
   - Open https://app.brevo.com
   - Verify account is active
   - Check API key status

2. **If API key is invalid**:
   - Generate new key
   - Update `.env.local`
   - Commit and push to master
   - Wait for Vercel deployment

3. **If sender email not verified**:
   - Add/verify `noreply@braidme.com`
   - Wait for verification
   - Test email sending

4. **Test the system**:
   - Go to `/forgot-password`
   - Enter test email
   - Check if email arrives
   - Click reset link
   - Update password
   - Login with new password

## Files to Update
- `.env.local` - Update BREVO_API_KEY if needed
- No code changes needed - system is already correct

## Deployment
After updating `.env.local`:
```bash
git add .env.local
git commit -m "Update Brevo API credentials"
git push origin master
# Wait 5-10 minutes for Vercel deployment
```
