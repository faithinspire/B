# 🚀 START HERE - Fix Emails & Make Admins

## Two Problems. Two Solutions. 12 Minutes.

---

## Problem 1: Emails Not Sending ❌

**Root Cause**: Resend domain `braidme.com` not verified

**Solution**: Verify domain in Resend (5 minutes)

**Guide**: `RESEND_DOMAIN_VERIFICATION_GUIDE.md`

---

## Problem 2: Need 3 Admins ❌

**Root Cause**: Users not marked as admin in database

**Solution**: Run SQL migration (2 minutes)

**Guide**: `COPY_PASTE_SQL_NOW.md`

---

## What To Do RIGHT NOW

### Step 1: Run SQL (2 minutes)
1. Open: **https://app.supabase.com/**
2. Select **BRAID2** project
3. Click **SQL Editor** → **New Query**
4. Open file: `COPY_PASTE_SQL_NOW.md`
5. Copy the SQL
6. Paste into editor
7. Click **Run**
8. ✅ Done!

### Step 2: Verify Domain (5 minutes)
1. Open: **https://resend.com/domains**
2. Click **Add Domain**
3. Enter: **braidme.com**
4. Click **Add**
5. Add DNS records to your registrar
6. Wait for verification (1-5 minutes)
7. ✅ Done!

### Step 3: Test (5 minutes)
1. Go to: **http://localhost:3001/login**
2. Click **Forgot Password**
3. Enter your email
4. Check inbox for email from `noreply@braidme.com`
5. Click reset link
6. Set new password
7. ✅ Done!

---

## Files You Need

| File | Purpose | Time |
|------|---------|------|
| `COPY_PASTE_SQL_NOW.md` | SQL to run | 2 min |
| `RESEND_DOMAIN_VERIFICATION_GUIDE.md` | Domain setup | 5 min |
| `FIX_EMAILS_AND_ADMINS_NOW.md` | Quick guide | Reference |
| `SESSION_FINAL_ACTION_SUMMARY.md` | Full summary | Reference |

---

## Quick Links

- **Supabase**: https://app.supabase.com/
- **Resend**: https://resend.com/domains
- **App**: http://localhost:3001/login

---

## Success Checklist

- [ ] Ran SQL migration
- [ ] Saw success messages
- [ ] Verified Resend domain
- [ ] Saw green checkmark
- [ ] Tested password reset
- [ ] Received email
- [ ] Clicked reset link
- [ ] Set new password
- [ ] Logged in
- [ ] Tested admin access
- [ ] ✅ ALL WORKING!

---

## Troubleshooting

**Email not received?**
- Check Resend domain shows green checkmark
- Check spam folder
- Wait 5 minutes for DNS

**Admin access denied?**
- Make sure you used admin email
- Refresh page
- Check SQL ran successfully

**Reset link doesn't work?**
- Check link hasn't expired
- Try requesting new link

---

## Timeline

| Task | Time |
|------|------|
| SQL Migration | 2 min |
| Domain Verification | 5 min |
| Testing | 5 min |
| **Total** | **12 min** |

---

## Status

✅ Code deployed
✅ SQL ready
✅ Guides ready
⏳ Waiting for you to execute

---

**Next Step**: Open `COPY_PASTE_SQL_NOW.md` and run the SQL!

