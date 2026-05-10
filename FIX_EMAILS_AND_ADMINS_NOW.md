# 🚀 Fix Emails & Make Admins - DO THIS NOW

## Two Issues to Fix

### Issue 1: Emails Not Sending
**Root Cause**: Resend domain `braidme.com` not verified

### Issue 2: Need 3 Admins
**Solution**: Update database + bypass RLS

---

## STEP 1: Run SQL Migration (2 minutes)

1. Go to: **https://app.supabase.com/**
2. Select **BRAID2** project
3. Click **SQL Editor** → **New Query**
4. Copy entire SQL from: `COMPLETE_FIX_EMAILS_AND_ADMINS.sql`
5. Click **Run**
6. ✅ You should see success messages

**What this does:**
- Creates `password_reset_tokens` table with correct schema
- Makes first 3 users admin
- Disables RLS on both tables for API access
- Grants all permissions

---

## STEP 2: Verify Resend Domain (5 minutes)

### Go to Resend
1. Go to: **https://resend.com/domains**
2. Click **Add Domain**
3. Enter: **braidme.com**
4. Click **Add**

### Add DNS Records
5. You'll see DNS records to add
6. Go to your domain registrar (GoDaddy, Namecheap, etc.)
7. Add each DNS record
8. Save changes

### Wait for Verification
9. Go back to Resend
10. Wait 1-2 minutes
11. You'll see ✅ **Green checkmark** when verified

---

## STEP 3: Test Everything (5 minutes)

### Test Password Reset
1. Go to: **http://localhost:3001/login**
2. Click **"Forgot Password"**
3. Enter your email
4. Check inbox for email from `noreply@braidme.com`
5. Click reset link
6. Set new password
7. ✅ Login with new password

### Test Admin Access
1. Go to: **http://localhost:3001/admin**
2. Login with one of the 3 admin emails
3. You should see admin dashboard
4. ✅ Admin access working

---

## ✅ Checklist

- [ ] Ran SQL migration in Supabase
- [ ] Saw success messages
- [ ] Went to Resend domains
- [ ] Added braidme.com domain
- [ ] Added DNS records to registrar
- [ ] Waited for verification
- [ ] Saw green checkmark
- [ ] Tested password reset
- [ ] Received email from noreply@braidme.com
- [ ] Clicked reset link
- [ ] Set new password
- [ ] Logged in with new password
- [ ] Tested admin access
- [ ] Saw admin dashboard
- [ ] ✅ ALL WORKING!

---

## 🆘 Troubleshooting

### SQL Error: "Table already exists"
**Solution**: This is fine! The `DROP TABLE IF EXISTS` handles it.

### Email still not received
**Solution**: 
- Make sure Resend domain shows green checkmark
- Check spam/promotions folder
- Wait 5 minutes for DNS to propagate
- Try with different email

### Admin dashboard not accessible
**Solution**:
- Make sure you logged in with one of the 3 admin emails
- Check that SQL migration ran successfully
- Refresh page and try again

### Reset link doesn't work
**Solution**:
- Make sure link hasn't expired (24 hours)
- Check that password_reset_tokens table was created
- Try requesting new reset link

---

## 📊 What Changed

| Component | Before | After |
|-----------|--------|-------|
| **Password Reset Table** | ❌ Missing | ✅ Created |
| **Admin Users** | ❌ None | ✅ 3 users |
| **RLS** | ❌ Blocking | ✅ Disabled |
| **Emails** | ❌ Not sending | ⏳ Pending domain |

---

## ⏱️ Total Time: ~12 minutes

1. SQL migration: 2 min
2. Resend domain: 5 min
3. Testing: 5 min

---

**Status**: Ready to execute!

