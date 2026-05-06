# Supabase Setup Guide - Full Access

## Step 1: Disable Email Confirmation (CRITICAL)

This is why you can't sign in after signing up. Follow these steps:

### In Supabase Dashboard:
1. Go to https://app.supabase.com
2. Select your project: **braidly** (gymgxcspjysrkluxyavd)
3. Navigate to **Authentication** → **Providers**
4. Click on **Email**
5. Find the toggle for **"Confirm email"** 
6. **TURN IT OFF** (toggle should be gray/disabled)
7. Click **Save**

This allows users to sign in immediately after signup without email confirmation.

## Step 2: Enable Auto-Confirm (Alternative)

If you want to keep email confirmation but auto-confirm:

1. Go to **Authentication** → **Providers** → **Email**
2. Find **"Confirm email"** toggle
3. Keep it ON
4. Find **"Auto-confirm users"** toggle
5. **TURN IT ON**
6. Click **Save**

This auto-confirms all signups (good for development/testing).

## Step 3: Verify Database Tables

Your Supabase project should have these tables:

- `profiles` - User profiles with role (customer, braider, admin)
- `braider_profiles` - Braider-specific data
- `services` - Services offered by braiders
- `bookings` - Booking records
- `reviews` - Customer reviews
- `disputes` - Dispute records
- `notifications` - User notifications

If tables are missing, run the SQL setup script in the next section.

## Step 4: Create Database Tables (If Needed)

Go to **SQL Editor** in Supabase and run this:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('customer', 'braider', 'admin')) DEFAULT 'customer',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  default_location JSONB,
  default_address TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('email', 'sms', 'in_app')),
  referral_code TEXT UNIQUE,
  referred_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create braider_profiles table
CREATE TABLE IF NOT EXISTS braider_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  travel_radius_miles INTEGER DEFAULT 10,
  is_mobile BOOLEAN DEFAULT TRUE,
  salon_address TEXT,
  cancellation_policy TEXT,
  working_hours JSONB,
  verification_status TEXT DEFAULT 'unverified',
  persona_inquiry_id TEXT,
  checkr_candidate_id TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  profile_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES braider_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  braider_id UUID NOT NULL REFERENCES profiles(id),
  service_id UUID NOT NULL REFERENCES services(id),
  slot_id TEXT,
  appointment_date TIMESTAMP,
  location_address TEXT,
  location_coords JSONB,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  total_amount DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  braider_payout DECIMAL(10,2),
  escrow_released BOOLEAN DEFAULT FALSE,
  auto_release_at TIMESTAMP,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  braider_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[],
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  raised_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  description TEXT,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'open',
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public braider profiles" ON braider_profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Braiders can update their own profile" ON braider_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 5: Test the Setup

1. Go to your app: http://localhost:3001
2. Click "Join as Braider" or "Join as Customer"
3. Fill in the form and click "Complete Signup"
4. You should see a success message
5. Go to Login page
6. Sign in with the same email and password
7. You should be logged in successfully

## Troubleshooting

### Still can't sign in?
- Check that email confirmation is disabled in Supabase
- Clear browser cache and cookies
- Try a different email address
- Check browser console for errors

### Tables don't exist?
- Run the SQL setup script above
- Make sure you're in the correct Supabase project
- Check that SQL executed without errors

### Getting 400 errors?
- Verify your Supabase URL and keys in `.env.local`
- Make sure the project is active (not paused)
- Check Supabase project status dashboard

---

**Your Supabase Project:**
- URL: https://gymgxcspjysrkluxyavd.supabase.co
- Project ID: gymgxcspjysrkluxyavd
