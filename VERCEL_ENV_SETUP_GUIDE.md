# VERCEL ENVIRONMENT VARIABLES SETUP GUIDE

## THE PROBLEM

Your `.env.local` file is **NOT** available to Vercel because:
1. `.env.local` is in `.gitignore` (never pushed to GitHub)
2. Vercel only has access to files in your GitHub repository
3. During build time, Vercel has NO access to your local machine files
4. Environment variables must be explicitly set in Vercel's dashboard

## THE SOLUTION

You need to add environment variables to Vercel's project settings.

### STEP 1: Go to Vercel Dashboard

1. Open https://vercel.com/dashboard
2. Click on your project "B"
3. Go to **Settings** tab
4. Click **Environment Variables** in the left sidebar

### STEP 2: Add Environment Variables

Add these variables from your `.env.local`:

**For Production (main branch):**

```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
```

**For Preview (pull requests):**
- Same variables as production

### STEP 3: Get Your Values

Open your `.env.local` file and copy these exact values:

```bash
# From .env.local:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### STEP 4: Add Each Variable

For each variable:
1. Click **Add New**
2. Enter the name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter the value (paste from `.env.local`)
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**

### STEP 5: Redeploy

After adding all variables:
1. Go to **Deployments** tab
2. Find the latest failed deployment
3. Click the **...** menu
4. Click **Redeploy**

OR push a new commit to trigger automatic redeploy:

```bash
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin master
```

---

## WHAT EACH VARIABLE DOES

| Variable | Purpose | Where to Find |
|----------|---------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side API key | Supabase Dashboard → Settings → API |

---

## FINDING YOUR SUPABASE CREDENTIALS

1. Go to https://app.supabase.com
2. Select your project
3. Click **Settings** (gear icon)
4. Click **API** in the left sidebar
5. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

## VERIFICATION

After redeploy, check if build succeeds:

1. Go to Vercel Dashboard
2. Click **Deployments**
3. Check the latest deployment status
4. If green ✅ - Success!
5. If red ❌ - Check build logs for errors

---

## COMMON ISSUES

### Issue: "supabaseUrl is required"
**Cause:** Environment variables not set in Vercel  
**Fix:** Follow steps above to add variables

### Issue: Variables show in Vercel but build still fails
**Cause:** Need to redeploy after adding variables  
**Fix:** Click redeploy button or push new commit

### Issue: Can't find Supabase credentials
**Cause:** Wrong Supabase project or not logged in  
**Fix:** Verify you're in correct Supabase project

---

## QUICK CHECKLIST

- [ ] Opened Vercel Dashboard
- [ ] Went to project "B" Settings
- [ ] Clicked Environment Variables
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Clicked Save for each variable
- [ ] Redeployed the project
- [ ] Checked build status (should be green ✅)

---

## AFTER SETUP

Once environment variables are set in Vercel:
1. Builds will complete successfully
2. No more "supabaseUrl is required" errors
3. All API endpoints will work
4. Pages will render correctly

---

**This is a one-time setup. After this, all future deployments will have access to these variables.**

