# 📧 Resend Domain Verification - Complete Guide

## Why This Matters
Without verifying your domain, Resend won't send emails from `noreply@braidme.com`. This is the **blocker** for password reset emails.

---

## Step-by-Step: Verify braidme.com Domain

### Step 1: Go to Resend Dashboard
1. Open: **https://resend.com/domains**
2. Login with your Resend account
3. You should see a list of domains (or empty if first time)

### Step 2: Add New Domain
4. Click **"Add Domain"** button (top right)
5. A modal will appear asking for domain name
6. Enter: **braidme.com** (exactly as shown)
7. Click **"Add"** button

### Step 3: Get DNS Records
8. Resend will show you DNS records to add
9. You'll see something like:
   - **CNAME record**: `default._domainkey.braidme.com` → `default.braidme.resend.dev`
   - **MX record**: `braidme.com` → `feedback-smtp.resend.com`
   - **TXT record**: `v=spf1 include:resend.com ~all`

10. **Copy each record** (Resend usually has a copy button)

### Step 4: Add DNS Records to Your Registrar

#### If using GoDaddy:
1. Go to: **https://www.godaddy.com/domains**
2. Find **braidme.com** in your domains list
3. Click **"Manage"**
4. Click **"DNS"** tab
5. Scroll to **"Records"** section
6. Click **"Add"** for each record from Resend
7. Select record type (CNAME, MX, TXT)
8. Enter the values from Resend
9. Click **"Save"**

#### If using Namecheap:
1. Go to: **https://www.namecheap.com/domains/mydomains/**
2. Find **braidme.com**
3. Click **"Manage"**
4. Click **"Advanced DNS"** tab
5. Click **"Add New Record"** for each record
6. Select type, enter values from Resend
7. Click **"Save All Changes"**

#### If using other registrar:
- Look for "DNS Management" or "DNS Settings"
- Add records as shown by Resend
- Save changes

### Step 5: Wait for Verification
11. Go back to Resend: **https://resend.com/domains**
12. You should see **braidme.com** in the list
13. Status will show: ⏳ **"Pending"** or ✅ **"Verified"**
14. **Wait 1-5 minutes** for DNS to propagate
15. Refresh the page
16. Status should change to: ✅ **"Verified"** (green checkmark)

### Step 6: Confirm Success
17. Once verified, you'll see:
    - ✅ Green checkmark next to domain
    - Status: **"Verified"**
    - You can now send emails from `noreply@braidme.com`

---

## How to Know It's Working

### In Resend Dashboard
- ✅ Green checkmark next to `braidme.com`
- Status shows: **"Verified"**

### In Your App
- Send password reset email
- Check inbox for email from `noreply@braidme.com`
- Email should arrive in 1-2 seconds

---

## Common Issues & Solutions

### Issue: DNS Records Not Showing in Registrar
**Solution**: 
- Wait 5-10 minutes for registrar to update
- Try logging out and back in
- Try different browser
- Contact registrar support

### Issue: Resend Still Shows "Pending" After 10 minutes
**Solution**:
- Double-check DNS records are correct
- Make sure you added ALL records (CNAME, MX, TXT)
- Wait another 5 minutes
- Try refreshing Resend page

### Issue: Email Still Not Received
**Solution**:
- Verify domain shows green checkmark in Resend
- Check spam/promotions folder
- Try with different email address
- Check app logs for errors

### Issue: "Domain Already Exists"
**Solution**:
- You already added this domain
- Just verify it's showing green checkmark
- If not verified, wait for DNS propagation

---

## DNS Record Reference

If you need to manually add records, here's what to look for:

### CNAME Record
- **Name**: `default._domainkey`
- **Value**: `default.braidme.resend.dev`
- **TTL**: 3600 (or default)

### MX Record
- **Name**: `@` or `braidme.com`
- **Value**: `feedback-smtp.resend.com`
- **Priority**: 10
- **TTL**: 3600 (or default)

### SPF Record (TXT)
- **Name**: `@` or `braidme.com`
- **Value**: `v=spf1 include:resend.com ~all`
- **TTL**: 3600 (or default)

---

## Verification Checklist

- [ ] Opened Resend domains page
- [ ] Clicked "Add Domain"
- [ ] Entered "braidme.com"
- [ ] Clicked "Add"
- [ ] Copied DNS records from Resend
- [ ] Logged into domain registrar
- [ ] Added CNAME record
- [ ] Added MX record
- [ ] Added SPF record
- [ ] Saved all changes in registrar
- [ ] Waited 1-5 minutes
- [ ] Refreshed Resend page
- [ ] Saw green checkmark ✅
- [ ] Status shows "Verified"
- [ ] Tested password reset email
- [ ] Received email from noreply@braidme.com
- [ ] ✅ EMAILS WORKING!

---

## Next Steps After Verification

1. ✅ Domain verified in Resend
2. Run SQL migration in Supabase (if not done)
3. Test password reset flow
4. Verify admins can access dashboard
5. Monitor email delivery

---

## Support

If you get stuck:
1. Check Resend docs: https://resend.com/docs
2. Check your registrar's DNS help
3. Verify all DNS records are correct
4. Wait for DNS propagation (can take up to 24 hours, usually 5-10 min)

---

**Status**: Ready to verify domain!

