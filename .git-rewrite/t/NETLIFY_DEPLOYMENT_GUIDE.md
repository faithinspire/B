# Netlify Deployment Guide - Braidly

## Quick Start Deployment

### Step 1: Prerequisites
- GitHub account with the repository pushed
- Netlify account (free at https://netlify.com)
- All environment variables ready

### Step 2: Connect to Netlify

#### Option A: Using Netlify UI (Recommended)
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Select GitHub as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select the `faithinspire/BRAIDER` repository
6. Click "Deploy site"

#### Option B: Using Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
```

### Step 3: Configure Environment Variables

In Netlify Dashboard:
1. Go to Site settings → Build & deploy → Environment
2. Add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=https://your-netlify-domain.netlify.app
NODE_ENV=production
```

**Note**: Replace all `your_*` placeholders with actual values from your `.env.local` file. Never commit actual API keys to GitHub.

### Step 4: Deploy

1. Push your code to GitHub:
```bash
git add -A
git commit -m "Prepare for Netlify deployment"
git push origin master
```

2. Netlify will automatically detect the push and start building
3. Monitor the build progress in the Netlify dashboard
4. Once deployed, you'll get a live URL

## Build Configuration

The `netlify.toml` file handles:
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: 18
- Environment: Production
- Security headers
- Cache policies
- Redirects for SPA routing

## Environment Variables Explained

| Variable | Purpose | Required |
|----------|---------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | Yes |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe public key | Yes |
| STRIPE_SECRET_KEY | Stripe secret key | Yes |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Google Maps API key | Yes |
| TWILIO_ACCOUNT_SID | Twilio account ID | Yes |
| TWILIO_AUTH_TOKEN | Twilio auth token | Yes |
| TWILIO_VERIFY_SERVICE_SID | Twilio verify service ID | Yes |
| RESEND_API_KEY | Resend email API key | Yes |
| NEXT_PUBLIC_APP_URL | Your deployed app URL | Yes |
| NODE_ENV | Environment (production) | Yes |

## Deployment Checklist

- ✅ All code committed to GitHub
- ✅ netlify.toml created
- ✅ Environment variables configured
- ✅ Build command verified
- ✅ Node version set to 18
- ✅ Security headers configured
- ✅ Cache policies set
- ✅ Redirects configured for SPA

## Post-Deployment Steps

### 1. Verify Deployment
- Check the Netlify dashboard for successful build
- Visit your live URL
- Test homepage loads correctly
- Verify braiders are displaying
- Test authentication flow

### 2. Configure Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., braidly.com)
4. Follow DNS configuration instructions
5. Update NEXT_PUBLIC_APP_URL environment variable

### 3. Set Up Monitoring
1. Enable Netlify Analytics
2. Set up error tracking
3. Configure performance monitoring
4. Set up alerts for build failures

### 4. Enable Continuous Deployment
- Netlify automatically deploys on every push to master
- Configure branch deploys for staging/preview
- Set up deploy previews for pull requests

## Troubleshooting

### Build Fails
1. Check build logs in Netlify dashboard
2. Verify all environment variables are set
3. Ensure Node version is 18+
4. Check for TypeScript errors: `npm run type-check`

### Environment Variables Not Working
1. Verify variables are set in Netlify dashboard
2. Ensure no typos in variable names
3. Redeploy after adding/changing variables
4. Check that NEXT_PUBLIC_ prefix is used for client-side vars

### API Calls Failing
1. Verify Supabase credentials are correct
2. Check CORS settings in Supabase
3. Verify API keys have correct permissions
4. Check browser console for error messages

### Images Not Loading
1. Verify image paths are correct
2. Check that public folder is included in build
3. Verify image URLs use relative paths
4. Check Netlify cache settings

## Performance Optimization

### Caching Strategy
- Static assets: 1 year cache
- API routes: No cache
- Images: 24 hour cache
- HTML: No cache (always fresh)

### Build Optimization
- Next.js automatic code splitting
- Image optimization enabled
- CSS minification
- JavaScript minification

## Security

### Headers Configured
- X-Frame-Options: Prevent clickjacking
- X-Content-Type-Options: Prevent MIME sniffing
- X-XSS-Protection: Enable XSS protection
- Referrer-Policy: Control referrer information
- Permissions-Policy: Control browser features

### Best Practices
- Never commit .env.local to GitHub
- Use Netlify environment variables for secrets
- Rotate API keys regularly
- Monitor for suspicious activity
- Keep dependencies updated

## Monitoring & Maintenance

### Daily
- Check Netlify dashboard for errors
- Monitor application logs
- Test critical user flows

### Weekly
- Review performance metrics
- Check for failed deployments
- Update dependencies if needed

### Monthly
- Review security logs
- Audit API usage
- Optimize performance
- Update documentation

## Support & Resources

- Netlify Docs: https://docs.netlify.com
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs

## Deployment Status

- ✅ Configuration files created
- ✅ Environment variables documented
- ✅ Build settings optimized
- ✅ Security headers configured
- ✅ Ready for deployment

---

**Last Updated**: March 15, 2026
**Status**: Ready for Production Deployment
