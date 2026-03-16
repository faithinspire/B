# NETLIFY DEPLOYMENT - FIXED GUIDE

## ❌ WHAT WENT WRONG
You uploaded the `.next` folder (build output) to Netlify manually. This causes the "Unable to read file 0.pack.gz" error because:
- `.next` is generated build output, not source code
- Netlify needs to BUILD your app on their servers
- The `.next` folder contains cache files that can't be read when uploaded

## ✅ CORRECT DEPLOYMENT METHODS

Choose ONE of these three methods:

### METHOD 1: Git Deployment (RECOMMENDED - Most Reliable)

**Step 1: Push Your Code to GitHub**

```bash
# If you don't have git initialized yet
git init
git add .
git commit -m "Initial commit for Netlify"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Step 2: Connect Netlify to GitHub**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" (or your Git provider)
4. Authorize Netlify to access your repositories
5. Select your repository from the list

**Step 3: Configure Build Settings**

Netlify should auto-detect Next.js, but verify these settings:
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18 (set in netlify.toml already)

Click "Deploy site"

**Step 4: Add Environment Variables**

1. Go to Site settings → Environment variables
2. Click "Add a variable" and add each one:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Step 5: Redeploy**

After adding environment variables:
1. Go to Deploys tab
2. Click "Trigger deploy" → "Deploy site"

✅ Done! Your site will build and deploy automatically.

---

### METHOD 2: Netlify CLI (For Advanced Users)

**Step 1: Install Netlify CLI**

```bash
npm install -g netlify-cli
```

**Step 2: Login**

```bash
netlify login
```

This opens your browser to authenticate.

**Step 3: Initialize Your Site**

```bash
netlify init
```

Follow the prompts:
- Choose "Create & configure a new site"
- Select your team
- Enter a site name
- Build command: `npm run build`
- Publish directory: `.next`

**Step 4: Set Environment Variables**

```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your_value"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_value"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_value"
netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "your_value"
netlify env:set STRIPE_SECRET_KEY "your_value"
netlify env:set STRIPE_WEBHOOK_SECRET "your_value"
netlify env:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY "your_value"
```

**Step 5: Deploy**

```bash
netlify deploy --prod
```

✅ Done! Your site is live.

---

### METHOD 3: Manual Upload (If You Can't Use Git)

**IMPORTANT**: Upload SOURCE CODE, NOT the `.next` folder!

**Step 1: Create a ZIP of Your Source Code**

Create a ZIP file that includes:
- ✅ `app/` folder
- ✅ `public/` folder
- ✅ `lib/` folder
- ✅ `store/` folder
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `next.config.js`
- ✅ `netlify.toml`
- ✅ `.npmrc`
- ✅ `tsconfig.json`
- ✅ `tailwind.config.js`
- ✅ `postcss.config.js`

**EXCLUDE these folders/files:**
- ❌ `.next/` (build output - DO NOT INCLUDE)
- ❌ `node_modules/` (dependencies)
- ❌ `.git/` (git history)
- ❌ `.env.local` (secrets - add via Netlify dashboard)

**Step 2: Upload to Netlify**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag and drop your ZIP file
4. Netlify will automatically detect Next.js and build it

**Step 3: Add Environment Variables**

1. Go to Site settings → Environment variables
2. Add all your environment variables (see METHOD 1 Step 4)

**Step 4: Redeploy**

After adding environment variables, trigger a new deploy from the Deploys tab.

✅ Done!

---

## WHAT FILES TO INCLUDE/EXCLUDE

### ✅ INCLUDE (Source Code)
```
app/
public/
lib/
store/
components/
package.json
package-lock.json
next.config.js
netlify.toml
.npmrc
tsconfig.json
tailwind.config.js
postcss.config.js
```

### ❌ EXCLUDE (Build Output & Dependencies)
```
.next/          ← DO NOT UPLOAD THIS
node_modules/   ← DO NOT UPLOAD THIS
.git/
.env.local      ← DO NOT UPLOAD THIS (use Netlify env vars)
.vercelignore
```

---

## WHY YOUR METHOD FAILED

1. **`.next` folder is build output**: It's meant to be generated on the server, not uploaded
2. **0.pack.gz error**: This file is part of Next.js build cache and can't be read when uploaded manually
3. **Missing dependencies**: When you upload `.next`, Netlify doesn't have `node_modules` to run it

---

## RECOMMENDED APPROACH

**Use Git deployment (Option 1)** - It's the most reliable:

```bash
# 1. Create GitHub repo
# Go to github.com and create new repository

# 2. Push your code
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/braidly.git
git push -u origin main

# 3. Connect to Netlify
# Go to netlify.com → New site from Git → Select repo

# 4. Configure build
# Build command: npm run build
# Publish directory: .next

# 5. Add environment variables in Netlify dashboard

# 6. Deploy!
```

---

## TROUBLESHOOTING

### "Build failed" error
- Check build logs in Netlify
- Make sure all environment variables are set
- Verify `netlify.toml` and `next.config.js` are correct

### "Module not found" error
- Run `npm install` locally to verify dependencies
- Check that `package.json` has all required packages
- Verify imports use correct paths

### "Environment variable undefined" error
- Add all `NEXT_PUBLIC_*` variables in Netlify
- Redeploy after adding variables

---

## QUICK START (Git Method)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Deploy to Netlify"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# 2. Go to netlify.com
# 3. Click "New site from Git"
# 4. Select your repo
# 5. Build command: npm run build
# 6. Publish directory: .next
# 7. Add environment variables
# 8. Deploy!
```

**That's it! Netlify will build and deploy your app correctly.**
