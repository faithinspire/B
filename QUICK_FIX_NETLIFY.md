# ⚡ QUICK FIX - NETLIFY DEPLOYMENT

## The Problem
```
❌ You uploaded .next folder → Error: "Unable to read file 0.pack.gz"
```

## The Solution
```
✅ Upload SOURCE CODE → Netlify builds it → Success!
```

---

## 🚀 FASTEST FIX (5 Minutes)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Deploy to Netlify"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Connect Netlify
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Choose GitHub → Select your repo
4. Click "Deploy site"

### Step 3: Add Environment Variables
Go to Site settings → Environment variables → Add these 7:
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
Deploys tab → Trigger deploy → Deploy site

### ✅ DONE!

---

## 📚 Need More Help?

| File | Use Case |
|------|----------|
| START_HERE_NETLIFY.md | Overview of all methods |
| DEPLOY_CHECKLIST.md | Step-by-step with checkboxes |
| NETLIFY_DEPLOY_NOW.md | Detailed 5-minute guide |
| NETLIFY_VISUAL_GUIDE.md | Visual diagrams |

---

## 💡 Remember

**Never upload `.next` folder!**

Always deploy source code and let Netlify build it.
