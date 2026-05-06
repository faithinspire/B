# Braidly - Premium Braiding Marketplace

A world-class, production-ready React mobile app built with Next.js 14, TypeScript, Tailwind CSS, and Supabase. Fully responsive, API-integrated, and ready for deployment.

## 🎨 Design System

- **Colors**: Purple (#9333ea), Blue (#3b82f6), Pink (#ec4899), White
- **Typography**: Playfair Display (headings), DM Sans (body)
- **Mobile-First**: Optimized for 375px+ screens
- **Responsive**: Fully tested on mobile, tablet, and desktop

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Payments**: Stripe Connect (escrow via manual capture)
- **Maps**: Google Maps JavaScript API
- **Identity**: Persona API (ID verification)
- **Background Checks**: Checkr API
- **SMS/OTP**: Twilio Verify
- **Email**: Resend
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- Google Maps API key
- Twilio account
- Resend account

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd braidly
npm install
```

### 2. Environment Setup

Copy `.env.local.example` to `.env.local` and fill in all required variables:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `PERSONA_API_KEY`
- `NEXT_PUBLIC_PERSONA_TEMPLATE_ID`
- `CHECKR_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`

### 3. Supabase Setup

1. Create a new Supabase project
2. Run all SQL migrations from `supabase/migrations/` directory
3. Enable RLS on all tables
4. Configure Storage buckets for portfolio images
5. Set up Auth providers (Email, Google, Apple)

### 4. Database Migrations

Execute these SQL commands in Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT CHECK (role IN ('customer', 'braider', 'admin')) NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  default_location GEOGRAPHY(Point, 4326),
  default_address TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('email', 'sms', 'in_app')),
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create braider_profiles table
CREATE TABLE braider_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  bio TEXT,
  travel_radius_miles INTEGER DEFAULT 10,
  is_mobile BOOLEAN DEFAULT true,
  salon_address TEXT,
  cancellation_policy TEXT,
  working_hours JSONB,
  verification_status TEXT CHECK (verification_status IN ('unverified', 'tier1_pending', 'tier1_verified', 'tier2_pending', 'tier2_verified', 'safety_badge_pro')) DEFAULT 'unverified',
  persona_inquiry_id TEXT,
  checkr_candidate_id TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  profile_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID REFERENCES braider_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('box_braids', 'knotless', 'cornrows', 'locs', 'twists', 'kids', 'other')),
  duration_minutes INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id),
  braider_id UUID REFERENCES braider_profiles(id),
  service_id UUID REFERENCES services(id),
  slot_id UUID,
  appointment_date TIMESTAMPTZ NOT NULL,
  location_address TEXT,
  location_coords GEOGRAPHY(Point, 4326),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'escrowed', 'in_progress', 'completed', 'disputed', 'refunded', 'cancelled')) DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  braider_payout NUMERIC(10,2) NOT NULL,
  escrow_released BOOLEAN DEFAULT false,
  auto_release_at TIMESTAMPTZ,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) UNIQUE,
  reviewer_id UUID REFERENCES profiles(id),
  braider_id UUID REFERENCES braider_profiles(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  photos TEXT[],
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create disputes table
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  raised_by UUID REFERENCES profiles(id),
  reason TEXT CHECK (reason IN ('service_not_delivered', 'quality_issue', 'safety_concern', 'other')) NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT CHECK (status IN ('open', 'under_review', 'resolved_refund', 'resolved_partial', 'resolved_released', 'closed')) DEFAULT 'open',
  admin_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  braider_id UUID REFERENCES braider_profiles(id),
  gross_amount NUMERIC(10,2),
  platform_commission NUMERIC(10,2),
  commission_rate NUMERIC(5,2),
  net_payout NUMERIC(10,2),
  stripe_transfer_id TEXT,
  payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read/update own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public can read approved braider profiles" ON braider_profiles
  FOR SELECT USING (profile_approved = true);

CREATE POLICY "Braiders can update own profile" ON braider_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can read services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Braiders can manage own services" ON services
  FOR ALL USING (braider_id = auth.uid());

CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (customer_id = auth.uid() OR braider_id = auth.uid());

CREATE POLICY "Users can insert own bookings" ON bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Public can read reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can read own disputes" ON disputes
  FOR SELECT USING (raised_by = auth.uid());

CREATE POLICY "Users can insert own disputes" ON disputes
  FOR INSERT WITH CHECK (raised_by = auth.uid());

CREATE POLICY "Braiders can read own transactions" ON transactions
  FOR SELECT USING (braider_id = auth.uid());

CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
braidly/
├── app/
│   ├── (public)/              # Public routes
│   │   ├── page.tsx           # Landing page
│   │   ├── login/
│   │   ├── signup/
│   │   ├── search/
│   │   └── braider/[id]/
│   ├── (customer)/            # Protected customer routes
│   │   ├── dashboard/
│   │   ├── booking/[id]/
│   │   ├── profile/
│   │   ├── referrals/
│   │   └── notifications/
│   ├── (braider)/             # Protected braider routes
│   │   └── braider/
│   │       ├── dashboard/
│   │       ├── calendar/
│   │       ├── services/
│   │       ├── wallet/
│   │       └── verify/
│   ├── (admin)/               # Protected admin routes
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── users/
│   │       ├── disputes/
│   │       ├── verification/
│   │       └── financials/
│   ├── api/                   # API routes
│   │   ├── stripe/
│   │   ├── twilio/
│   │   └── maps/
│   ├── layout.tsx
│   └── globals.css
├── components/                # Reusable components
├── lib/                       # Utilities & configs
│   ├── supabase.ts
│   ├── stripe.ts
│   ├── validations.ts
│   └── utils.ts
├── store/                     # Zustand stores
│   ├── authStore.ts
│   └── bookingStore.ts
├── middleware.ts              # Route protection
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🔐 Authentication

- Email/Password signup and login
- Google OAuth integration
- Apple OAuth integration
- JWT-based session management
- Protected routes via middleware

## 💳 Payment Flow

1. Customer selects service and books appointment
2. Frontend calls `/api/stripe/create-payment-intent`
3. Stripe creates PaymentIntent with `capture_method: 'manual'`
4. Customer completes payment (funds held in escrow)
5. After service completion, funds are captured and transferred to braider
6. Platform commission is deducted based on verification tier

## 🔄 Real-Time Features

- Supabase Realtime subscriptions for:
  - Booking updates
  - Notifications
  - Dispute status changes
  - Transaction updates

## 📱 Responsive Design

- Mobile-first approach
- Tested on 375px, 768px, 1280px+ screens
- Touch-friendly buttons and inputs
- Safe area insets for notched devices

## ✅ Quality Assurance

- TypeScript strict mode enabled
- No console.log in production code
- All API keys secured in environment variables
- Form validation with Zod
- Error handling on all async operations
- Loading states for all data-fetching components
- Empty states for all list/grid views

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Environment Variables

Set all `.env.local` variables in Vercel project settings.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out

### Payment Endpoints
- `POST /api/stripe/create-payment-intent` - Create payment
- `POST /api/stripe/webhook` - Stripe webhooks

### OTP Endpoints
- `POST /api/twilio/send-otp` - Send verification code
- `POST /api/twilio/verify-otp` - Verify code

## 🐛 Troubleshooting

### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check RLS policies are correctly configured
- Ensure tables exist in database

### Stripe Integration
- Verify webhook secret is correct
- Check Stripe account is in test mode
- Ensure publishable key matches secret key

### Google Maps
- Verify API key has Maps JavaScript API enabled
- Check API key restrictions are not too strict
- Ensure billing is enabled

## 📞 Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for Braidly**
