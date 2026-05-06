# Braidly Deployment Checklist

Complete checklist before deploying to production.

## Code Quality

- [ ] No TypeScript errors: `npm run type-check`
- [ ] No console.log statements in production code
- [ ] All API keys in environment variables
- [ ] No hardcoded URLs (use env vars)
- [ ] Error handling on all async operations
- [ ] Loading states on all data-fetching components
- [ ] Empty states for all lists/grids
- [ ] Form validation with Zod
- [ ] Proper error messages for users

## Security

- [ ] All routes protected with middleware
- [ ] Admin routes check role server-side
- [ ] RLS policies enabled on all tables
- [ ] No sensitive data in localStorage
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] API keys never exposed to client
- [ ] Stripe webhook signature verified
- [ ] Rate limiting on API routes
- [ ] SQL injection prevention (using Supabase)

## Database

- [ ] All tables created with correct schema
- [ ] RLS policies configured
- [ ] Indexes created for frequently queried columns
- [ ] Foreign keys properly set up
- [ ] Triggers for auto-generated fields working
- [ ] Backups configured
- [ ] Database connection pooling enabled

## Authentication

- [ ] Email/password signup working
- [ ] Email/password login working
- [ ] Google OAuth configured
- [ ] Apple OAuth configured
- [ ] Email verification working
- [ ] Password reset working
- [ ] Session management working
- [ ] Logout clears session

## Payments

- [ ] Stripe test mode working
- [ ] Payment intent creation working
- [ ] Manual capture working
- [ ] Webhook signature verification working
- [ ] Commission calculations correct
- [ ] Payout calculations correct
- [ ] Escrow logic working
- [ ] Dispute resolution working

## Integrations

- [ ] Google Maps loading correctly
- [ ] Places autocomplete working
- [ ] Persona ID verification embedded
- [ ] Checkr background check flow working
- [ ] Twilio OTP sending
- [ ] Twilio OTP verification
- [ ] Resend email sending
- [ ] All webhooks receiving events

## UI/UX

- [ ] Mobile responsive (375px+)
- [ ] Tablet responsive (768px+)
- [ ] Desktop responsive (1280px+)
- [ ] Touch-friendly buttons (min 44px)
- [ ] Color contrast WCAG AA compliant
- [ ] Focus rings visible on all interactive elements
- [ ] Loading skeletons showing
- [ ] Error messages clear and helpful
- [ ] Success messages showing
- [ ] No broken links

## Performance

- [ ] Images optimized with next/image
- [ ] Code splitting working
- [ ] Lazy loading implemented
- [ ] Bundle size < 500KB
- [ ] Lighthouse Performance > 85
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse SEO > 90
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s

## Testing

- [ ] Sign up flow tested
- [ ] Login flow tested
- [ ] Booking flow tested
- [ ] Payment flow tested
- [ ] Braider dashboard tested
- [ ] Customer dashboard tested
- [ ] Admin dashboard tested
- [ ] Search functionality tested
- [ ] Filters working correctly
- [ ] Notifications working

## Environment Variables

- [ ] NEXT_PUBLIC_SUPABASE_URL set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set
- [ ] SUPABASE_SERVICE_ROLE_KEY set
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY set
- [ ] STRIPE_SECRET_KEY set
- [ ] STRIPE_WEBHOOK_SECRET set
- [ ] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY set
- [ ] PERSONA_API_KEY set
- [ ] NEXT_PUBLIC_PERSONA_TEMPLATE_ID set
- [ ] CHECKR_API_KEY set
- [ ] TWILIO_ACCOUNT_SID set
- [ ] TWILIO_AUTH_TOKEN set
- [ ] TWILIO_VERIFY_SERVICE_SID set
- [ ] RESEND_API_KEY set
- [ ] RESEND_FROM_EMAIL set
- [ ] NEXT_PUBLIC_APP_URL set

## Deployment

- [ ] Build succeeds: `npm run build`
- [ ] No build warnings
- [ ] Vercel deployment configured
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured
- [ ] SSL certificate installed
- [ ] Redirects configured (www, http → https)
- [ ] Sitemap generated
- [ ] robots.txt configured

## Webhooks

- [ ] Stripe webhook URL updated
- [ ] Stripe webhook events selected
- [ ] Stripe webhook secret verified
- [ ] Persona webhook URL updated
- [ ] Persona webhook events selected
- [ ] Checkr webhook URL updated
- [ ] Checkr webhook events selected
- [ ] All webhooks tested

## Monitoring

- [ ] Error tracking set up (Sentry)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up
- [ ] Alerts configured for errors
- [ ] Database monitoring enabled
- [ ] API rate limiting monitored

## Documentation

- [ ] README.md complete
- [ ] SETUP_GUIDE.md complete
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment instructions clear
- [ ] Troubleshooting guide included

## Legal

- [ ] Privacy Policy page created
- [ ] Terms of Service page created
- [ ] Cookie policy created
- [ ] GDPR compliance reviewed
- [ ] Data retention policy set
- [ ] User data deletion process documented

## Analytics

- [ ] Google Analytics configured
- [ ] Conversion tracking set up
- [ ] User behavior tracking enabled
- [ ] Error tracking enabled
- [ ] Performance metrics tracked

## Backup & Recovery

- [ ] Database backups configured
- [ ] Backup retention policy set
- [ ] Disaster recovery plan documented
- [ ] Data export process tested
- [ ] Rollback procedure documented

## Final Checks

- [ ] All team members notified
- [ ] Deployment window scheduled
- [ ] Rollback plan ready
- [ ] Support team briefed
- [ ] Monitoring dashboard open
- [ ] Status page updated
- [ ] Announcement prepared

## Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Check all critical user flows
- [ ] Verify all integrations working
- [ ] Monitor performance metrics
- [ ] Check user feedback
- [ ] Verify email delivery
- [ ] Test payment processing
- [ ] Confirm webhooks receiving events

## Sign-Off

- [ ] Product Manager: _______________
- [ ] Tech Lead: _______________
- [ ] QA Lead: _______________
- [ ] DevOps: _______________

**Deployment Date**: _______________

**Deployed By**: _______________

**Notes**: 

---

**Ready for Production! 🚀**
