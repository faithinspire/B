# 🚀 NETLIFY DEPLOYMENT - BACKUP PLAN

**Status**: Ready if Vercel fails  
**Time**: ~5 minutes  
**Complexity**: Low  

---

## WHEN TO USE THIS

Use this if:
- ❌ Vercel deployment still stuck after force push
- ❌ Vercel shows errors in logs
- ❌ Vercel deployment takes too long
- ✅ You want to get marketplace live NOW

---

## QUICK START - DEPLOY TO NETLIFY NOW

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This will:
- Open browser
- Ask you to authorize
- Create authentication token

### Step 3: Deploy to Netlify

```bash
netlify deploy --prod
```

This will:
- Build your app
- Deploy to Netlify
- Show you the live URL
- Take ~3-5 minutes

---

## DETAILED STEPS

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

**Expected Output**:
```
added X packages
```

### Step 2: Verify Installation

```bash
netlify --version
```

**Expected Output**:
```
netlify-cli/X.X.X
```

### Step 3: Login to Netlify

```bash
netlify login
```

**What happens**:
1. Browser opens
2. Netlify login page appears
3. Click "Authorize"
4. Return to terminal
5. You're logged in

### Step 4: Deploy to Production

```bash
netlify deploy --prod
```

**What happens**:
1. App builds
2. Deploys to Netlify
3. Shows live URL
4. Takes 3-5 minutes

**Expected Output**:
```
✔ Deploying to production
✔ Deploy complete
✔ Live URL: https://your-app.netlify.app
```

---

## AFTER DEPLOYMENT

### Verify Deployment

1. Go to the live URL shown
2. Check homepage (marketplace carousel)
3. Check braider dashboard (SELL section)
4. Check add product page
5. Check marketplace page

### Update DNS (Optional)

If you have a custom domain:
1. Go to Netlify dashboard
2. Click your site
3. Go to **Domain settings**
4. Add your custom domain
5. Update DNS records

---

## NETLIFY BUILD SETTINGS

If deployment fails, check build settings:

1. Go to https://app.netlify.com
2. Click your site
3. Go to **Site settings** → **Build & deploy**
4. Verify:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 18 or higher

---

## ENVIRONMENT VARIABLES

Make sure environment variables are set in Netlify:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` (if using Stripe)
   - Any other API keys

---

## TROUBLESHOOTING

### Build Fails

**Check logs**:
1. Go to Netlify dashboard
2. Click your site
3. Go to **Deploys**
4. Click latest deploy
5. Click **Deploy log**
6. Look for error messages

**Common errors**:
- TypeScript errors: Fix in code
- Missing env vars: Add to Netlify
- Out of memory: Increase build timeout

### Deployment Stuck

**Try again**:
```bash
netlify deploy --prod --force
```

### Wrong URL

**Get your Netlify URL**:
```bash
netlify sites:list
```

---

## COMPARISON: VERCEL vs NETLIFY

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Deployment | Webhook-based | CLI or webhook |
| Speed | Fast | Fast |
| Reliability | Usually reliable | Very reliable |
| Free tier | Yes | Yes |
| Custom domain | Yes | Yes |
| Environment vars | Yes | Yes |
| Build logs | Yes | Yes |

---

## QUICK REFERENCE

```bash
# Install
npm install -g netlify-cli

# Login
netlify login

# Deploy to production
netlify deploy --prod

# Check status
netlify status

# View logs
netlify logs

# List sites
netlify sites:list
```

---

## EXPECTED RESULT

After Netlify deployment:

✅ App is live on Netlify URL  
✅ Homepage shows marketplace carousel  
✅ Braider dashboard shows SELL section  
✅ Add product page works  
✅ Marketplace page works  
✅ All responsive on mobile/tablet/desktop  

---

## TIMELINE

```
Now:           Install Netlify CLI (1 min)
+1 min:        Login to Netlify (1 min)
+2 min:        Deploy to Netlify (3-5 min)
+7 min:        Deployment complete
+9 min:        Verify deployment
+11 min:       🎉 LIVE!
```

---

## NEXT STEPS

1. **If Vercel works**: Use Vercel URL
2. **If Vercel fails**: Use Netlify deployment
3. **After deployment**: Execute Supabase migration
4. **Then**: Test marketplace

---

**Status**: 🟢 READY - Use if Vercel fails  
**Time**: ~5 minutes  
**Impact**: Gets marketplace live on Netlify!

