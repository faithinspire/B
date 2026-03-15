# Netlify Deployment - Quick Start Guide

## 🚀 Deploy in 5 Minutes

### What You Need
- Netlify account (free at https://netlify.com)
- GitHub account with access to the repository
- API keys from `.env.local`

### Step 1: Go to Netlify Dashboard
Visit: https://app.netlify.com

### Step 2: Connect GitHub Repository
1. Click **"Add new site"** → **"Import an existing project"**
2. Select **GitHub** as your Git provider
3. Click **"Authorize Netlify"** and grant permissions
4. Search for and select: **`faithinspire/BRAIDER`**
5. Click **"Deploy site"**

**⏱️ Time: 1 minute**

### Step 3: Add Environment Variables
While the site is building:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Click **"Edit variables"**
3. Add these variables (copy values from your `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
RESEND_API_KEY
NODE_ENV=production
```

4. Click **"Save"**

**⏱️ Time: 2 minutes**

### Step 4: Trigger Redeploy
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for build to complete (usually 2-3 minutes)

**⏱️ Time: 3-5 minutes**

### Step 5: Verify Deployment
1. Once build is complete, click the site URL
2. Test:
   - ✅ Homepage loads
   - ✅ Braiders display
   - ✅ Can sign up
   - ✅ Can log in
   - ✅ No console errors

**⏱️ Time: 1 minute**

---

## ✅ You're Done!

Your app is now live at: `https://your-site.netlify.app`

### Next Steps (Optional)
- Add custom domain in Site settings → Domain management
- Enable analytics in Site settings → Analytics
- Set up monitoring and alerts

---

## 🆘 Quick Troubleshooting

### Build Failed?
- Check build logs in Netlify dashboard
- Verify all environment variables are set
- Ensure no typos in variable names

### App Shows "Supabase not configured"?
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Redeploy after adding variables

### Braiders Not Showing?
- Check browser console for errors
- Verify Supabase credentials are correct
- Check that braiders table has data in Supabase

### Need Help?
- Check full guide: `NETLIFY_DEPLOYMENT_GUIDE.md`
- Check checklist: `NETLIFY_DEPLOYMENT_CHECKLIST.md`
- Netlify docs: https://docs.netlify.com

---

**Status**: Ready to deploy! 🎉

