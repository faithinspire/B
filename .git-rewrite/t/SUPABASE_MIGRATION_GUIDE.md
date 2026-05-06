# Supabase Real-Time Migration Guide

## Overview
This guide explains how to migrate the Braidly app from local storage to Supabase for real-time synchronization across browsers and devices.

## What's New

### Created Files
1. **store/supabaseAuthStore.ts** - Supabase authentication store
2. **store/supabaseBraiderStore.ts** - Supabase braider profiles with real-time sync
3. **.kiro/specs/supabase-realtime-migration/** - Complete migration specification

### Key Features
- ✅ Real-time synchronization across browsers
- ✅ Supabase authentication (email/password)
- ✅ Database persistence
- ✅ Real-time subscriptions
- ✅ International app support
- ✅ Payment integration ready

## Setup Instructions

### Step 1: Configure Supabase

1. Create a Supabase project at https://supabase.com
2. Get your API keys from Project Settings
3. Update `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Create Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'braider', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  default_location JSONB,
  default_address TEXT,
  preferred_contact TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Braider profiles table
CREATE TABLE braider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  travel_radius_miles INTEGER DEFAULT 10,
  is_mobile BOOLEAN DEFAULT FALSE,
  salon_address TEXT,
  specialties TEXT[] DEFAULT '{}',
  verification_status TEXT DEFAULT 'unverified',
  rating_avg DECIMAL(3,2) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES braider_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio table
CREATE TABLE portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES braider_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  style TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  braider_id UUID NOT NULL REFERENCES profiles(id),
  service_id UUID NOT NULL REFERENCES services(id),
  appointment_date TIMESTAMP NOT NULL,
  location_address TEXT,
  location_coords JSONB,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2),
  braider_payout DECIMAL(10,2),
  escrow_released BOOLEAN DEFAULT FALSE,
  auto_release_at TIMESTAMP,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES profiles(id),
  participant2_id UUID NOT NULL REFERENCES profiles(id),
  last_message TEXT,
  last_message_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, braider_id)
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  braider_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[],
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Disputes table
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  raised_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'open',
  admin_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 3: Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies (example for profiles)
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Step 4: Update Auth Store Usage

Replace old auth store with new Supabase auth store:

```typescript
// Old
import { useAuthStore } from '@/store/authStore';

// New
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

// Usage
const { user, signUp, signIn, signOut } = useSupabaseAuthStore();
```

### Step 5: Update Braider Store Usage

Replace old braider store with new Supabase braider store:

```typescript
// Old
import { useBraiderProfileStore } from '@/store/braiderProfileStore';

// New
import { useSupabaseBraiderStore } from '@/store/supabaseBraiderStore';

// Usage
const { profiles, createProfile, subscribeToProfiles } = useSupabaseBraiderStore();

// Subscribe to real-time updates
useEffect(() => {
  subscribeToProfiles();
  return () => unsubscribeFromProfiles();
}, []);
```

## Migration Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Auth store updated in all pages
- [ ] Braider store updated in all pages
- [ ] Booking store migrated
- [ ] Message store migrated
- [ ] Image storage configured
- [ ] Payment integration tested
- [ ] Cross-browser testing completed
- [ ] Real-time sync verified
- [ ] Deployed to production

## Testing Real-Time Sync

1. Open app in two browsers
2. Sign up as braider in Browser 1
3. Check if braider appears in Browser 2 homepage immediately
4. Create booking in Browser 1
5. Verify booking appears in Browser 2 instantly
6. Send message in Browser 1
7. Verify message appears in Browser 2 in real-time

## Troubleshooting

### Braiders not appearing
- Check if braider profile was created in database
- Verify RLS policies allow reading profiles
- Check browser console for errors

### Real-time updates not working
- Verify Supabase Realtime is enabled
- Check subscription is active
- Look for network errors in console

### Authentication issues
- Verify Supabase URL and keys are correct
- Check if user exists in Supabase Auth
- Verify profile was created in database

## Next Steps

1. Migrate booking store to Supabase
2. Migrate message store to Supabase
3. Set up Stripe Connect for payments
4. Implement image storage
5. Deploy to production
6. Monitor for issues
7. Optimize performance

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review error messages in browser console
3. Check database logs in Supabase dashboard
4. Test with Supabase CLI: `supabase status`
