# Vercel Environment Variables - Copy & Paste

## 🚀 Quick Setup

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these 5 variables:

```
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=apismtp@mailtrap.io
MAILTRAP_PASS=e0e8c129e8cec3851a6bb6ad9971f652
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

## ✅ Steps

1. Click **Settings** in Vercel dashboard
2. Click **Environment Variables** (left sidebar)
3. For each variable above:
   - Paste the name in "Name" field
   - Paste the value in "Value" field
   - Click **Save**
4. Go to **Deployments** tab
5. Click **...** on latest deployment
6. Select **Redeploy**
7. Wait for green checkmark ✅

## 🧪 Test

```bash
curl -X POST https://your-app.vercel.app/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

Check your email for the test message!

---

**That's it!** Your email system will be live after redeploy.
