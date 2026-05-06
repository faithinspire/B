# Netlify Deployment Checklist - Braidly

## Pre-Deployment Verification ✅

### Code Quality
- [x] All TypeScript errors fixed (0 errors)
- [x] All unused imports removed
- [x] All unused variables removed
- [x] Build command verified: `npm run build`
- [x] No console errors in development
- [x] Git repository clean and pushed to GitHub

### Configuration Files
- [x] `netlify.toml` created with correct settings
- [x] `package.json` has correct build scripts
- [x] `.env.local` has all required environment variables
- [x] `.vercelignore` configured (if using Vercel)
- [x] No secrets committed to GitHub

### Environment Variables Ready
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] SUPABASE_SERVICE_ROLE_KEY
- [x] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [x] STRIPE_SECRET_KEY
- [x] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- [x] TWILIO_ACCOUNT_SID
- [x] TWILIO_AUTH_TOKEN
- [x] TWILIO_VERIFY_SERVICE_SID
- [x] RESEND_API_KEY
- [x] NODE_ENV=production

## Deployment Steps

### Step 1: Connect GitHub to Netlify
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Select GitHub as provider
4. Authorize Netlify to access your GitHub account
5. Select repository: `faithinspire/BRAIDER`
6. Click "Deploy site"

**Expected Result**: Netlify will automatically detect `netlify.toml` and start building

### Step 2: Configure Environment Variables in Netlify Dashboard
1. Go to Site settings → Build & deploy → Environment
2. Add all environment variables from `.env.local`
3. **IMPORTANT**: Use placeholder values from `.env.local.example` as reference
4. Verify each variable is set correctly
5. Save changes

**Expected Result**: All environment variables visible in dashboard

### Step 3: Trigger Initial Build
1. Netlify should automatically start building after connecting GitHub
2. Monitor build progress in Netlify dashboard
3. Check build logs for any errors
4. Wait for deployment to complete

**Expected Result**: Green checkmark indicating successful deployment

### Step 4: Verify Deployment
1. Visit the provided Netlify URL (e.g., `https://your-site.netlify.app`)
2. Test homepage loads correctly
3. Verify braiders are displaying
4. Test authentication flow:
   - Try signing up as customer
   - Try signing up as braider
   - Try logging in
5. Test key features:
   - Browse braiders
   - View braider profiles
   - Test messaging (if applicable)
   - Test booking flow (if applicable)

**Expected Result**: All features working without errors

## Post-Deployment Configuration

### Step 1: Update App URL
1. In Netlify dashboard, find your site URL
2. Update `NEXT_PUBLIC_APP_URL` environment variable to your Netlify URL
3. Redeploy the site

### Step 2: Configure Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., braidly.com)
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` to custom domain
6. Redeploy

### Step 3: Enable Continuous Deployment
- Netlify automatically deploys on every push to master
- No additional configuration needed
- Each push triggers a new build

### Step 4: Set Up Monitoring
1. Enable Netlify Analytics (optional)
2. Configure error tracking
3. Set up alerts for build failures
4. Monitor performance metrics

## Troubleshooting Guide

### Build Fails
**Error**: Build fails during deployment
**Solution**:
1. Check build logs in Netlify dashboard
2. Verify all environment variables are set
3. Ensure Node version is 18+
4. Run `npm run type-check` locally to verify TypeScript
5. Check for missing dependencies

### Environment Variables Not Working
**Error**: App shows "Supabase not configured" or similar
**Solution**:
1. Verify variables are set in Netlify dashboard (not just locally)
2. Check for typos in variable names
3. Ensure NEXT_PUBLIC_ prefix for client-side variables
4. Redeploy after adding/changing variables
5. Clear browser cache and reload

### API Calls Failing
**Error**: API requests return 401 or 403 errors
**Solution**:
1. Verify Supabase credentials are correct
2. Check CORS settings in Supabase dashboard
3. Verify API keys have correct permissions
4. Check browser console for detailed error messages
5. Verify Stripe keys are for correct environment (test vs live)

### Images Not Loading
**Error**: Images show broken image icon
**Solution**:
1. Verify image paths are correct (relative paths)
2. Check that public folder is included in build
3. Verify image URLs don't have leading slashes
4. Check Netlify cache settings
5. Clear browser cache

### Braiders Not Displaying
**Error**: Homepage shows "No braiders found" or empty list
**Solution**:
1. Verify Supabase connection is working
2. Check that braiders table has data
3. Verify NEXT_PUBLIC_SUPABASE_URL is correct
4. Check browser console for API errors
5. Verify RLS policies allow public read access

## Performance Optimization

### Caching Strategy (Configured in netlify.toml)
- Static assets: 1 year cache
- API routes: No cache
- Images: 24 hour cache
- HTML: No cache (always fresh)

### Build Optimization
- Next.js automatic code splitting enabled
- Image optimization enabled
- CSS minification enabled
- JavaScript minification enabled

## Security Checklist

### Headers Configured (in netlify.toml)
- [x] X-Frame-Options: SAMEORIGIN (prevent clickjacking)
- [x] X-Content-Type-Options: nosniff (prevent MIME sniffing)
- [x] X-XSS-Protection: 1; mode=block (enable XSS protection)
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy: geolocation, microphone, camera (self only)

### Best Practices
- [x] Never commit .env.local to GitHub
- [x] Use Netlify environment variables for secrets
- [x] Rotate API keys regularly
- [x] Monitor for suspicious activity
- [x] Keep dependencies updated

## Monitoring & Maintenance

### Daily Tasks
- [ ] Check Netlify dashboard for errors
- [ ] Monitor application logs
- [ ] Test critical user flows

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check for failed deployments
- [ ] Update dependencies if needed

### Monthly Tasks
- [ ] Review security logs
- [ ] Audit API usage
- [ ] Optimize performance
- [ ] Update documentation

## Rollback Plan

If deployment has critical issues:

1. **Immediate Rollback**:
   - Go to Netlify dashboard → Deploys
   - Find the last working deployment
   - Click "Publish deploy"
   - Site will revert to previous version

2. **Git Rollback**:
   ```bash
   git revert HEAD
   git push origin master
   ```
   - Netlify will automatically redeploy with reverted code

3. **Emergency Hotfix**:
   - Create a new branch from last working commit
   - Fix the issue
   - Push to master
   - Netlify will deploy the fix

## Success Criteria

✅ Deployment is successful when:
- [ ] Build completes without errors
- [ ] Site is accessible at Netlify URL
- [ ] Homepage loads and displays braiders
- [ ] Authentication works (signup/login)
- [ ] All API calls return correct data
- [ ] Images load correctly
- [ ] No console errors in browser
- [ ] Performance is acceptable (< 3s load time)
- [ ] Mobile responsive design works
- [ ] All features tested and working

## Support Resources

- Netlify Docs: https://docs.netlify.com
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- GitHub: https://github.com/faithinspire/BRAIDER

---

**Last Updated**: March 15, 2026
**Status**: Ready for Deployment
**Next Step**: Connect GitHub repository to Netlify dashboard

