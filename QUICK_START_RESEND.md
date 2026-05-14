# 🚀 Quick Start: Resend Email Setup

## 1️⃣ Install Dependencies
```bash
npm install
```

## 2️⃣ Verify Environment Variables
Check `.env.local` has:
```env
RESEND_API_KEY=re_RyzgBnkm_7CoApGqrM9NqjaT5uvtKPs5Y
RESEND_FROM_EMAIL=noreply@braidme.com
```

## 3️⃣ Test Locally
```bash
npm run dev
```

Then test email:
```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

## 4️⃣ Deploy to Vercel
1. Go to https://vercel.com/dashboard
2. Select BraidMe project
3. Settings → Environment Variables
4. Add:
   - `RESEND_API_KEY` = `re_RyzgBnkm_7CoApGqrM9NqjaT5uvtKPs5Y`
   - `RESEND_FROM_EMAIL` = `noreply@braidme.com`
5. Save (auto-redeploy)

## 5️⃣ Test in Production
- Sign up as new customer
- Check email for welcome message
- Test password reset
- Verify emails arrive

## ✅ Done!

All emails now use Resend. No more Mailtrap!

---

## What Changed
- ✅ Mailtrap → Resend
- ✅ SMTP → REST API
- ✅ 6 email routes updated
- ✅ Environment variables updated
- ✅ Package.json updated

## Email Features Working
- ✅ Welcome emails
- ✅ Password reset
- ✅ SOS alerts
- ✅ Dispute notifications
- ✅ Test endpoint

## Need Help?
- Check: `RESEND_MIGRATION_SUMMARY.md`
- Setup: `RESEND_SETUP_GUIDE.md`
- Action: `ACTION_CARD_RESEND_MIGRATION.md`

---

**Status**: Ready for deployment
**Time**: 5-10 minutes
**Risk**: Low
