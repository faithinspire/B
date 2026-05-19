# Brevo Email Service - Testing Guide

## Quick Start Testing

### 1. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## Test 1: Test Email Endpoint

**Purpose:** Verify Brevo API connection is working

**Steps:**
1. Open your browser and navigate to:
   ```
   http://localhost:3000/api/auth/test-email?email=your-email@example.com
   ```

2. Or use curl:
   ```bash
   curl "http://localhost:3000/api/auth/test-email?email=your-email@example.com"
   ```

**Expected Result:**
- ✅ Email received from `noreply@braidme.com`
- ✅ Subject: "Test Email - BraidMe"
- ✅ Email arrives within 1-2 minutes

**If it fails:**
- Check console logs for error messages
- Verify `BREVO_API_KEY` in `.env.local`
- Verify `BREVO_FROM_EMAIL` is verified in Brevo account

---

## Test 2: Customer Signup Flow

**Purpose:** Test signup email verification

**Steps:**
1. Navigate to `http://localhost:3000/signup/customer`
2. Fill in the form:
   - Email: Use a test email you can access
   - Password: Any password
   - Full Name: Test User
   - Phone: +1234567890
   - Country: United States
3. Click "Sign Up"
4. Check your email for verification link

**Expected Result:**
- ✅ Signup successful
- ✅ Verification email received from `noreply@braidme.com`
- ✅ Email contains verification link
- ✅ Clicking link confirms email

**If it fails:**
- Check browser console for errors
- Check server logs for email sending errors
- Verify email address is valid

---

## Test 3: Braider Signup & Verification

**Purpose:** Test braider verification email flow

**Steps:**
1. Navigate to `http://localhost:3000/signup/braider`
2. Complete braider signup form
3. Login to braider dashboard
4. Go to "Verify" section
5. Submit verification documents
6. Check email for confirmation

**Expected Result:**
- ✅ Verification submitted email received
- ✅ Email from `noreply@braidme.com`
- ✅ Email confirms documents were received

**Admin Approval Test:**
1. Login as admin
2. Go to Admin Dashboard → Verification
3. Find the pending verification
4. Click "Approve"
5. Check braider's email for approval notification

**Expected Result:**
- ✅ Approval email received
- ✅ Email contains dashboard link
- ✅ Braider can now accept bookings

---

## Test 4: Password Reset Flow

**Purpose:** Test password reset email

**Steps:**
1. Navigate to `http://localhost:3000/forgot-password`
2. Enter your email address
3. Click "Send Reset Link"
4. Check email for reset link

**Expected Result:**
- ✅ Reset email received from `noreply@braidme.com`
- ✅ Email contains reset link
- ✅ Link is valid for 24 hours
- ✅ Clicking link allows password reset

---

## Test 5: Dispute Creation

**Purpose:** Test dispute notification email

**Steps:**
1. Create a booking between customer and braider
2. As customer, go to booking details
3. Click "Raise Dispute"
4. Fill in dispute details
5. Submit dispute
6. Check support email for notification

**Expected Result:**
- ✅ Support notification email sent
- ✅ Email contains dispute details
- ✅ Email contains link to admin dashboard

---

## Test 6: Emergency SOS Alert

**Purpose:** Test emergency alert email

**Steps:**
1. Create an active booking
2. During booking, click "SOS Emergency"
3. Confirm emergency alert
4. Check support email for alert

**Expected Result:**
- ✅ Emergency alert email received
- ✅ Email marked as urgent (🚨)
- ✅ Email contains location and booking details
- ✅ Email contains link to incident details

---

## Monitoring Email Delivery

### Check Brevo Dashboard
1. Go to https://app.brevo.com
2. Login with your account
3. Navigate to "Transactional" → "Emails"
4. View delivery status for all emails
5. Check bounce rates and failures

### Check Email Logs
1. In app console, look for `[brevo]` logs
2. Each email send will show:
   ```
   [brevo] Sending email from: BraidMe <noreply@braidme.com>
   [brevo] ✅ Email sent successfully: <messageId>
   ```

### Troubleshoot Failed Emails
1. Check error message in console
2. Verify API key is correct
3. Verify sender email is verified in Brevo
4. Check Brevo dashboard for account limits
5. Review email content for spam triggers

---

## Common Issues & Solutions

### Issue: "Invalid API Key"
**Solution:**
1. Copy API key from Brevo dashboard
2. Update `BREVO_API_KEY` in `.env.local`
3. Restart dev server

### Issue: "Sender email not verified"
**Solution:**
1. Go to Brevo dashboard
2. Verify `noreply@braidme.com` in sender list
3. Or update `BREVO_FROM_EMAIL` to a verified email

### Issue: Email not received
**Solution:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check Brevo dashboard for delivery status
4. Check console logs for errors
5. Try test email endpoint first

### Issue: Emails going to spam
**Solution:**
1. Add SPF/DKIM records for domain
2. Use verified domain email
3. Improve email content (avoid spam triggers)
4. Check Brevo reputation score

---

## Performance Testing

### Load Testing Email Sending
```bash
# Send 10 test emails
for i in {1..10}; do
  curl "http://localhost:3000/api/auth/test-email?email=test$i@example.com"
done
```

**Expected Result:**
- ✅ All emails sent successfully
- ✅ No rate limiting errors
- ✅ All emails delivered within 2 minutes

---

## Production Testing Checklist

Before deploying to production:

- [ ] All 6 tests pass locally
- [ ] Emails arrive within 2 minutes
- [ ] No emails in spam folder
- [ ] Brevo dashboard shows successful delivery
- [ ] API key is secure (not in git)
- [ ] Environment variables set in Vercel
- [ ] Sender email verified in Brevo
- [ ] Email templates render correctly
- [ ] Links in emails work correctly
- [ ] No console errors during email sending

---

## Next Steps

1. **Run all tests locally** - Verify everything works
2. **Deploy to Vercel** - Push to master (already done)
3. **Test in production** - Verify emails work on live site
4. **Monitor delivery** - Check Brevo dashboard regularly
5. **Optimize** - Adjust templates based on feedback

---

## Support

If you encounter issues:

1. Check console logs for error messages
2. Review Brevo dashboard for delivery status
3. Verify environment variables are set correctly
4. Check email address is valid
5. Review email content for spam triggers

**Brevo Documentation:** https://developers.brevo.com/docs/send-transactional-email
