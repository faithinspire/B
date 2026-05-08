# Resend Domain Verification - Step by Step

## Why This Matters
Without domain verification, Resend only sends emails to your account owner's email. After verification, emails go to ALL users.

---

## Step 1: Open Resend Dashboard

**URL:** https://resend.com/dashboard

**What you'll see:**
- Left sidebar with options
- "Domains" option in the menu

---

## Step 2: Go to Domains

**Click:** Domains (in left sidebar)

**What you'll see:**
- List of your domains (probably empty)
- Button: "Add Domain"

---

## Step 3: Add Your Domain

**Click:** "Add Domain" button

**Enter:** `braidme.com`

**Click:** "Add"

**What you'll see:**
- Your domain listed
- Status: "Pending verification"
- DNS records to add

---

## Step 4: Copy DNS Records

**You'll see something like:**

```
CNAME Record:
Name: resend._domainkey.braidme.com
Value: [long-value-here]

MX Record:
Name: braidme.com
Value: [another-value-here]
```

**Copy these values** - you'll need them in the next step.

---

## Step 5: Add DNS Records to Your Domain

### If Using Vercel (Most Common)

1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Domains**
4. Find `braidme.com`
5. Click **Edit**
6. Go to **DNS Records** tab
7. Click **Add Record**
8. Add the CNAME record from Resend:
   - Type: CNAME
   - Name: `resend._domainkey.braidme.com`
   - Value: [paste from Resend]
9. Click **Save**
10. Repeat for MX record if needed

### If Using GoDaddy

1. Go to https://www.godaddy.com/dashboard
2. Click **Domains**
3. Find `braidme.com`
4. Click **Manage DNS**
5. Click **Add Record**
6. Add the CNAME record:
   - Type: CNAME
   - Name: `resend._domainkey`
   - Value: [paste from Resend]
7. Click **Save**

### If Using Namecheap

1. Go to https://www.namecheap.com/dashboard
2. Click **Domain List**
3. Find `braidme.com`
4. Click **Manage**
5. Go to **Advanced DNS** tab
6. Click **Add New Record**
7. Add the CNAME record:
   - Type: CNAME Record
   - Host: `resend._domainkey.braidme.com`
   - Value: [paste from Resend]
8. Click **Save**

### If Using Other Registrar

1. Log in to your domain registrar
2. Find DNS management section
3. Add CNAME record with values from Resend
4. Save changes

---

## Step 6: Wait for Verification

**Time:** 5-30 minutes

**What's happening:** DNS changes are propagating across the internet

**What to do:** Wait and check back in 5-10 minutes

---

## Step 7: Verify It's Done

**Go back to:** https://resend.com/dashboard

**Click:** Domains

**Look for:** `braidme.com`

**Check status:**
- ✅ Verified = Success! You're done
- ⏳ Pending = Still waiting, check back in 5 minutes
- ❌ Failed = DNS records might be wrong, try again

---

## Step 8: Test Password Reset

**Go to:** Your app's `/forgot-password` page

**Test 1:** Send reset to your email
- Should arrive in inbox ✅

**Test 2:** Send reset to a different email
- Should arrive in that inbox ✅

**Test 3:** Check Resend dashboard
- Go to https://resend.com/dashboard
- Click **Emails**
- Should see emails to multiple addresses ✅

---

## Troubleshooting

### DNS Records Not Showing as Verified

**Problem:** Still showing "Pending" after 30 minutes

**Solution:**
1. Double-check DNS records are correct
2. Make sure you copied the exact values from Resend
3. Try removing and re-adding the domain
4. Wait another 10 minutes
5. Clear browser cache and refresh

### Emails Still Not Arriving

**Problem:** Reset emails not arriving in inbox

**Solution:**
1. Check spam/junk folder
2. Verify domain is showing ✅ in Resend
3. Check Resend dashboard → Emails for error messages
4. Try sending from a different email address
5. Restart your app after DNS verification

### Can't Find DNS Management

**Problem:** Don't know where to add DNS records

**Solution:**
1. Google: "[Your registrar] DNS management"
2. Contact your registrar's support
3. Check their documentation
4. Common registrars:
   - Vercel: vercel.com/dashboard
   - GoDaddy: godaddy.com/dashboard
   - Namecheap: namecheap.com/dashboard
   - AWS Route 53: console.aws.amazon.com

---

## Success Indicators

✅ Domain shows as "Verified" in Resend
✅ Reset emails arrive in different inboxes
✅ Emails show "From: noreply@braidme.com"
✅ Resend dashboard shows emails to multiple addresses

---

## After Verification

Your password reset system will now work for ALL users:
- User enters email → Gets reset link ✅
- Works for any registered email ✅
- Emails arrive reliably ✅
- Professional sender address ✅

---

## Questions?

- Resend docs: https://resend.com/docs
- Check DNS: https://mxtoolbox.com
- Resend support: https://resend.com/support

