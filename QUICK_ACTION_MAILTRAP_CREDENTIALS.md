# Quick Action: Update Mailtrap Credentials

## ✅ What's Done
- Syntax error fixed and pushed to master
- Mailtrap implementation complete
- Welcome emails ready to send

## ⚠️ What's Needed
Update SMTP credentials (NOT API keys)

## 🔑 Get Credentials
1. Go to: https://mailtrap.io
2. Login to your account
3. Click: **Settings → SMTP Credentials**
4. Copy the **SMTP Username** and **SMTP Password**

## 📝 Update .env.local
```env
MAILTRAP_USER=<paste-smtp-username-here>
MAILTRAP_PASS=<paste-smtp-password-here>
```

## 🚀 Deploy
```bash
git add .env.local
git commit -m "fix: Update Mailtrap SMTP credentials"
git push origin master
```

## 🔧 Update Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add/Update:
   - `MAILTRAP_USER` = your SMTP username
   - `MAILTRAP_PASS` = your SMTP password
5. Redeploy

## ✅ Test
```bash
curl -X POST https://your-app.vercel.app/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

Check your email for the test message!

---

**Note**: The SMTP credentials are different from the API key. Make sure you're copying the correct values from the SMTP Credentials section in Mailtrap.
