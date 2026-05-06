# Braidly Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration ✅
- [ ] Supabase URL configured
- [ ] Supabase keys configured
- [ ] Stripe keys configured
- [ ] Stripe webhook secret configured
- [ ] All environment variables in `.env.local`

### 2. Database Setup ✅
- [ ] All Supabase tables created
- [ ] RLS policies enabled
- [ ] Indexes created for performance
- [ ] Backups configured

### 3. Storage Setup ✅
- [ ] Avatars bucket created
- [ ] Portfolio bucket created
- [ ] Storage policies configured
- [ ] CORS configured
- [ ] CDN enabled

### 4. Stripe Setup ✅
- [ ] Stripe account created
- [ ] API keys configured
- [ ] Webhook endpoint configured
- [ ] Webhook secret saved
- [ ] Test payments working

### 5. Code Quality ✅
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Security reviewed

### 6. Testing ✅
- [ ] Sign up/login working
- [ ] Real-time sync tested
- [ ] Payments tested
- [ ] Messages tested
- [ ] Notifications tested
- [ ] Cross-browser tested
- [ ] Mobile tested

## Deployment Steps

### Step 1: Prepare Production Environment

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Test build locally
npm run start
```

### Step 2: Set Production Environment Variables

Create `.env.production.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or use GitHub integration
# Push to main branch and Vercel will auto-deploy
```

### Step 4: Configure Vercel Environment Variables

In Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add all production environment variables
3. Set to **Production** environment

### Step 5: Update Stripe Webhook

1. Go to Stripe Dashboard
2. Update webhook endpoint to: `https://yourdomain.com/api/stripe/webhook`
3. Update webhook secret in environment variables

### Step 6: Configure Supabase for Production

1. Go to Supabase Dashboard
2. Update allowed origins:
   - Add your production domain
   - Remove localhost

2. Enable SSL enforcement
3. Configure backups
4. Set up monitoring

### Step 7: Test Production Deployment

```bash
# Test sign up
# Test login
# Test braider profile creation
# Test real-time sync
# Test payment flow
# Test messaging
# Test notifications
```

### Step 8: Monitor Deployment

1. Check Vercel logs for errors
2. Monitor Supabase dashboard
3. Monitor Stripe dashboard
4. Set up error tracking (Sentry)
5. Set up analytics

## Post-Deployment

### 1. Verify Everything Works

- [ ] Homepage loads
- [ ] Sign up works
- [ ] Login works
- [ ] Braider profiles visible
- [ ] Real-time sync working
- [ ] Payments processing
- [ ] Messages sending
- [ ] Notifications working

### 2. Monitor Performance

- [ ] Page load times
- [ ] Database query times
- [ ] API response times
- [ ] Storage performance
- [ ] Error rates

### 3. Set Up Monitoring

```bash
# Install Sentry for error tracking
npm install @sentry/nextjs

# Configure in next.config.js
```

### 4. Enable Analytics

- [ ] Google Analytics
- [ ] Mixpanel
- [ ] Custom analytics

### 5. Set Up Alerts

- [ ] High error rate alert
- [ ] Slow response time alert
- [ ] Storage quota alert
- [ ] Payment failure alert

## Rollback Plan

If something goes wrong:

```bash
# Rollback to previous deployment
vercel rollback

# Or redeploy previous version
vercel --prod --target production
```

## Database Backup

### Automatic Backups
- Supabase automatically backs up daily
- Backups retained for 7 days

### Manual Backup
```bash
# Export database
supabase db pull

# This creates a migration file with current schema
```

### Restore from Backup
```bash
# Contact Supabase support to restore from backup
# Or use migration files to recreate schema
```

## Performance Optimization

### 1. Database Optimization
- [ ] Indexes created
- [ ] Queries optimized
- [ ] Connection pooling enabled
- [ ] Caching configured

### 2. Storage Optimization
- [ ] CDN enabled
- [ ] Images compressed
- [ ] Cache headers set
- [ ] Lazy loading implemented

### 3. Code Optimization
- [ ] Code splitting enabled
- [ ] Tree shaking enabled
- [ ] Minification enabled
- [ ] Image optimization enabled

### 4. Monitoring
- [ ] Error tracking enabled
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring enabled
- [ ] Log aggregation enabled

## Security Checklist

- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] RLS policies enabled
- [ ] API keys secured
- [ ] Secrets not in code
- [ ] Rate limiting enabled
- [ ] Input validation enabled
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

## Scaling Considerations

### Database
- Monitor connection count
- Optimize slow queries
- Add indexes as needed
- Consider read replicas

### Storage
- Monitor storage usage
- Clean up old files
- Optimize image sizes
- Consider CDN

### API
- Monitor request rates
- Implement caching
- Add rate limiting
- Consider load balancing

## Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check payment processing
- [ ] Verify real-time sync

### Weekly
- [ ] Review performance metrics
- [ ] Check storage usage
- [ ] Review user feedback

### Monthly
- [ ] Database optimization
- [ ] Security audit
- [ ] Performance review
- [ ] Backup verification

## Support

For deployment issues:
1. Check Vercel logs
2. Check Supabase logs
3. Check Stripe logs
4. Review error tracking
5. Contact support

## Useful Commands

```bash
# View logs
vercel logs

# View environment variables
vercel env ls

# Rebuild
vercel rebuild

# Redeploy
vercel --prod

# Check status
vercel status
```

## Deployment Timeline

- **Preparation**: 1-2 hours
- **Deployment**: 5-10 minutes
- **Testing**: 30 minutes
- **Monitoring**: Ongoing

## Success Criteria

✅ App loads without errors
✅ All features working
✅ Real-time sync working
✅ Payments processing
✅ No console errors
✅ Performance acceptable
✅ Security verified
✅ Monitoring active
