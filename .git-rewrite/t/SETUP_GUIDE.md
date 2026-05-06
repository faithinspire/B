# Braidly Setup Guide

Complete step-by-step guide to set up and deploy Braidly.

## Phase 1: Project Initialization

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Environment Configuration

Create `.env.local` file with all required variables:

```bash
cp .env.local.example .env.local
```

Fill in each variable with your actual credentials.

## Phase 2: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy `Project URL` and `Anon Key` to `.env.local`
4. Generate `Service Role Key` and add to `.env.local`

### Step 2: Create Database Tables

In Supabase SQL Editor, run the SQL from README.md "Database Migrations" section.

### Step 3: Enable Authentication

1. Go to Authentication → Providers
2. Enable Email/Password
3. Enable Google OAuth (add credentials)
4. Enable Apple OAuth (add credentials)

### Step 4: Create Storage Buckets

1. Go to Storage
2. Create bucket: `portfolio-images` (public)
3. Create bucket: `avatars` (public)

### Step 5: Set Up Auth Trigger

In SQL Editor, create trigger for new user profile:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Phase 3: Stripe Setup

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Create account and verify email
3. Go to Developers → API Keys
4. Copy Publishable Key to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
5. Copy Secret Key to `STRIPE_SECRET_KEY`

### Step 2: Set Up Webhooks

1. Go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy Signing Secret to `STRIPE_WEBHOOK_SECRET`

### Step 3: Configure Connect

1. Go to Settings → Connect Settings
2. Enable Stripe Connect
3. Configure redirect URLs for braider onboarding

## Phase 4: Google Maps Setup

### Step 1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project
3. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API

### Step 2: Create API Key

1. Go to Credentials
2. Create API Key
3. Restrict to HTTP referrers
4. Add your domain
5. Copy to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Phase 5: Persona Setup (ID Verification)

### Step 1: Create Persona Account

1. Go to [persona.com](https://persona.com)
2. Create account
3. Go to Dashboard → API Keys
4. Copy API Key to `PERSONA_API_KEY`

### Step 2: Create Template

1. Go to Templates
2. Create new template for ID verification
3. Copy Template ID to `NEXT_PUBLIC_PERSONA_TEMPLATE_ID`

### Step 3: Set Up Webhooks

1. Go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/persona/webhook`
3. Select events: `inquiry.completed`

## Phase 6: Checkr Setup (Background Checks)

### Step 1: Create Checkr Account

1. Go to [checkr.com](https://checkr.com)
2. Create account
3. Go to Settings → API
4. Copy API Key to `CHECKR_API_KEY`

### Step 2: Configure Workflows

1. Create workflow for background checks
2. Set up webhook: `https://yourdomain.com/api/checkr/webhook`

## Phase 7: Twilio Setup (SMS/OTP)

### Step 1: Create Twilio Account

1. Go to [twilio.com](https://twilio.com)
2. Create account
3. Go to Console
4. Copy Account SID to `TWILIO_ACCOUNT_SID`
5. Copy Auth Token to `TWILIO_AUTH_TOKEN`

### Step 2: Set Up Verify Service

1. Go to Verify → Services
2. Create new service
3. Copy Service SID to `TWILIO_VERIFY_SERVICE_SID`

## Phase 8: Resend Setup (Email)

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Create account
3. Go to API Keys
4. Copy API Key to `RESEND_API_KEY`

### Step 2: Configure Sender

1. Add verified sender domain
2. Set `RESEND_FROM_EMAIL` to your sender email

## Phase 9: Local Development

### Step 1: Start Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### Step 2: Test Authentication

1. Sign up as customer
2. Sign up as braider
3. Verify email confirmation works

### Step 3: Test Payment Flow

1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future date and CVC
3. Verify payment intent is created

### Step 4: Test Maps

1. Search for braiders
2. Verify map loads with markers
3. Test location autocomplete

## Phase 10: Deployment

### Step 1: Prepare for Production

```bash
npm run build
npm run type-check
```

### Step 2: Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

### Step 3: Set Environment Variables

In Vercel project settings, add all `.env.local` variables.

### Step 4: Update Webhook URLs

Update all webhook URLs to production domain:
- Stripe: `https://yourdomain.com/api/stripe/webhook`
- Persona: `https://yourdomain.com/api/persona/webhook`
- Checkr: `https://yourdomain.com/api/checkr/webhook`

### Step 5: Update OAuth Redirect URLs

Update in each provider:
- Google: `https://yourdomain.com/auth/callback/google`
- Apple: `https://yourdomain.com/auth/callback/apple`

## Phase 11: Post-Deployment

### Step 1: Verify All Integrations

- [ ] Authentication works
- [ ] Payments process correctly
- [ ] Emails send
- [ ] SMS OTP works
- [ ] Maps load
- [ ] Webhooks receive events

### Step 2: Security Audit

- [ ] No API keys exposed in client code
- [ ] All routes protected with middleware
- [ ] RLS policies enforced
- [ ] HTTPS enabled
- [ ] CORS configured correctly

### Step 3: Performance Optimization

- [ ] Images optimized with next/image
- [ ] Code splitting working
- [ ] Lighthouse score > 85
- [ ] Database queries optimized

### Step 4: Monitoring

Set up monitoring for:
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (Uptime Robot)
- Log aggregation (Supabase Logs)

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues

- Verify Supabase URL and keys
- Check RLS policies
- Ensure tables exist

### Payment Issues

- Verify Stripe keys match
- Check webhook secret
- Test with Stripe test mode

### Email Not Sending

- Verify Resend API key
- Check sender email is verified
- Review email templates

### Maps Not Loading

- Verify API key is correct
- Check API restrictions
- Ensure billing is enabled

## Support Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

## Next Steps

1. Customize branding and colors
2. Add additional features (reviews, ratings, etc.)
3. Implement analytics
4. Set up customer support system
5. Create admin dashboard features
6. Add push notifications
7. Implement referral rewards
8. Add advanced search filters

---

**Setup Complete! 🎉**

Your Braidly marketplace is now ready for production.
