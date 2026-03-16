# ✅ NETLIFY DEPLOYMENT CHECKLIST

## Before You Start

- [ ] You have a GitHub account
- [ ] You have a Netlify account (free at netlify.com)
- [ ] Your `.env.local` file has all required variables
- [ ] Your code is working locally (`npm run dev`)

---

## Step 1: Push to GitHub (5 minutes)

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Netlify deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git branch -M main
git push -u origin main
```

**Checklist:**
- [ ] Repository created on GitHub
- [ ] Code pushed successfully
- [ ] You can see your files on GitHub

---

## Step 2: Connect Netlify (2 minutes)

1. Go to https://app.netlify.com
2. Click **"Add new site"**
3. Click **"Import an existing project"**
4. Choose **"GitHub"**
5. Authorize Netlify (if first time)
6. Select your repository
7. Verify settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
8. Click **"Deploy site"**

**Checklist:**
- [ ] Netlify connected to GitHub
- [ ] Repository selected
- [ ] Build settings verified
- [ ] Initial deploy started (will fail without env vars - that's OK!)

---

## Step 3: Add Environment Variables (3 minutes)

1. In Netlify, go to **Site settings**
2. Click **Environment variables** (left sidebar)
3. Click **"Add a variable"**
4. Add each variable from your `.env.local`:

```
Variable Name                          | Value (from .env.local)
---------------------------------------|------------------------
NEXT_PUBLIC_SUPABASE_URL              | your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY         | your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY             | your_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    | your_stripe_publishable_key
STRIPE_SECRET_KEY                     | your_stripe_secret_key
STRIPE_WEBHOOK_SECRET                 | your_webhook_secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY       | your_google_maps_key
```

**Checklist:**
- [ ] All 7 environment variables added
- [ ] Values copied correctly (no extra spaces)
- [ ] Variable names match exactly (case-sensitive)

---

## Step 4: Redeploy (1 minute)

1. Go to **Deploys** tab
2. Click **"Trigger deploy"**
3. Click **"Deploy site"**
4. Wait 2-3 minutes for build to complete

**Checklist:**
- [ ] Deploy triggered
- [ ] Build completed successfully (green checkmark)
- [ ] No build errors in logs

---

## Step 5: Test Your Site (2 minutes)

1. Click the site URL (e.g., `your-site-name.netlify.app`)
2. Test these features:
   - [ ] Homepage loads correctly
   - [ ] No console errors (F12 → Console)
   - [ ] Login page works
   - [ ] Signup page works
   - [ ] Images load correctly

---

## 🎉 SUCCESS!

Your site is now live at: `https://your-site-name.netlify.app`

---

## 🔧 Optional: Custom Domain

Want to use your own domain (e.g., `braidly.com`)?

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 24 hours)

---

## 📊 Monitoring Your Site

### Check Build Status
- Go to **Deploys** tab
- See all deployments and their status
- Click any deploy to see build logs

### Check Site Analytics
- Go to **Analytics** tab (if enabled)
- See visitor stats, page views, etc.

### Check Function Logs
- Go to **Functions** tab
- See API route logs and errors

---

## 🔄 Future Deployments

Every time you push to GitHub, Netlify automatically:
1. Detects the push
2. Pulls the latest code
3. Runs `npm run build`
4. Deploys the new version

**No manual work needed!**

```bash
# Make changes to your code
git add .
git commit -m "Update feature X"
git push

# Netlify automatically deploys! 🚀
```

---

## 🆘 Troubleshooting

### Build Failed
- [ ] Check build logs in Netlify
- [ ] Verify all environment variables are set
- [ ] Run `npm run build` locally to test
- [ ] Check for TypeScript errors

### Site Shows Blank Page
- [ ] Open browser console (F12)
- [ ] Check for JavaScript errors
- [ ] Verify Supabase credentials are correct
- [ ] Check Netlify function logs

### Environment Variables Not Working
- [ ] Variable names match exactly (case-sensitive)
- [ ] No extra spaces in values
- [ ] Redeployed after adding variables
- [ ] `NEXT_PUBLIC_*` prefix for client-side variables

### Images Not Loading
- [ ] Images are in `public/` folder
- [ ] Image paths start with `/` (e.g., `/images/logo.png`)
- [ ] Image files are committed to Git
- [ ] Check browser network tab for 404 errors

---

## 📚 Additional Resources

- **Quick Start**: `NETLIFY_DEPLOY_NOW.md`
- **Visual Guide**: `NETLIFY_VISUAL_GUIDE.md`
- **Full Documentation**: `NETLIFY_CORRECT_DEPLOYMENT.md`
- **Netlify Docs**: https://docs.netlify.com

---

## 💡 Pro Tips

1. **Use Git branches**: Create a `dev` branch for testing
2. **Preview deploys**: Netlify creates preview URLs for pull requests
3. **Rollback**: Can rollback to any previous deploy instantly
4. **Environment-specific vars**: Set different vars for production vs preview
5. **Build hooks**: Trigger deploys via webhook (for CMS updates)

---

## ✅ Final Checklist

- [ ] Code on GitHub
- [ ] Netlify connected
- [ ] All environment variables added
- [ ] Site deployed successfully
- [ ] Site tested and working
- [ ] Custom domain configured (optional)

**You're done! 🎉**
