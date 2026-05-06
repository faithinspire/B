# 🚀 DEPLOY TO NETLIFY NOW - QUICK START

## What Happened?
You tried to upload the `.next` folder (build output) to Netlify. This doesn't work because Netlify needs to BUILD your app on their servers, not receive pre-built files.

## ✅ SOLUTION: Use Git Deployment (5 Minutes)

### Step 1: Push to GitHub

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Deploy to Netlify"

# Create a new repo on GitHub, then add it:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git branch -M main
git push -u origin main
```

### Step 2: Connect Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select your repository
5. Verify settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click **"Deploy site"**

### Step 3: Add Environment Variables

Go to **Site settings** → **Environment variables** → **Add a variable**

Copy these from your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### Step 4: Redeploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**

### ✅ DONE!

Your site will build and deploy in 2-3 minutes.

---

## Alternative: Netlify CLI (If You Prefer Command Line)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize and deploy
netlify init

# Set environment variables
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your_value"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_value"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_value"
netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "your_value"
netlify env:set STRIPE_SECRET_KEY "your_value"
netlify env:set STRIPE_WEBHOOK_SECRET "your_value"
netlify env:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY "your_value"

# Deploy
netlify deploy --prod
```

---

## 📋 Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify connected to GitHub repo
- [ ] Build settings verified (build command: `npm run build`, publish: `.next`)
- [ ] All 7 environment variables added
- [ ] Site redeployed after adding env vars
- [ ] Site is live and working

---

## 🆘 Troubleshooting

### Build fails with "Module not found"
- Check that all dependencies are in `package.json`
- Verify `netlify.toml` and `next.config.js` are in the repo

### Environment variables not working
- Make sure variable names match exactly (case-sensitive)
- Redeploy after adding variables
- Check that `NEXT_PUBLIC_*` variables are used in client-side code

### Site shows blank page
- Check browser console for errors
- Verify Supabase URL and keys are correct
- Check Netlify function logs for API errors

---

## 📚 Full Documentation

See `NETLIFY_CORRECT_DEPLOYMENT.md` for detailed explanations and alternative methods.
