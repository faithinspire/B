# Multi-Country System - Quick Start Guide

## What Was Implemented

✅ **Centralized Country Configuration** (`lib/countries.ts`)
- Nigeria (NG) & USA (US) support
- Easy to add more countries
- Phone formatting, validation, currency, payment gateway

✅ **Smart Components**
- `CountrySelector` - Dropdown with flags
- `PhoneInput` - Auto-formatting phone input
- `MultiCountrySignupForm` - Complete signup flow
- `MultiCountryLoginForm` - Email or phone login

✅ **Backend API**
- `/api/auth/signup-multi-country` - Multi-country signup
- Phone normalization & validation
- Duplicate prevention per country
- Automatic currency & payment gateway assignment

✅ **Database Schema**
- `profiles.country` - User's country
- `profiles.phone_normalized` - International format phone
- `profiles.currency` - User's currency (NGN/USD)
- `profiles.payment_gateway` - Payment provider (paystack/stripe)
- `braider_profiles.country` - Braider's country

---

## How to Use

### 1. Update Signup Page

Replace your current signup with multi-country version:

```tsx
// app/(public)/signup/customer/page.tsx
import { MultiCountrySignupForm } from '@/app/components/MultiCountrySignupForm';

export default function CustomerSignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-600 mb-8">Join BraidMe today</p>
        
        <MultiCountrySignupForm userType="customer" />
      </div>
    </div>
  );
}
```

### 2. Update Login Page

Replace your current login with multi-country version:

```tsx
// app/(public)/login/page.tsx
import { MultiCountryLoginForm } from '@/app/components/MultiCountryLoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
        <p className="text-gray-600 mb-8">Welcome back</p>
        
        <MultiCountryLoginForm />
      </div>
    </div>
  );
}
```

### 3. Run Database Migration

In Supabase SQL Editor, run:

```sql
-- Add multi-country support to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'NG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN';

-- Create index for country-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_normalized ON profiles(phone_normalized);

-- Add country field to braider_profiles for filtering
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'NG';
CREATE INDEX IF NOT EXISTS idx_braider_profiles_country ON braider_profiles(country);

-- Add payment gateway preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(20) DEFAULT 'paystack';

-- Create a countries table for reference
CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dial_code VARCHAR(5) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_gateway VARCHAR(20) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert supported countries
INSERT INTO countries (code, name, dial_code, currency, payment_gateway, timezone) VALUES
  ('NG', 'Nigeria', '+234', 'NGN', 'paystack', 'Africa/Lagos'),
  ('US', 'United States', '+1', 'USD', 'stripe', 'America/New_York')
ON CONFLICT (code) DO NOTHING;
```

### 4. Filter Braiders by Country

```tsx
// Get braiders in user's country
import { supabase } from '@/lib/supabase';

async function getBraidersInCountry(userCountry: string) {
  const { data } = await supabase
    .from('braider_profiles')
    .select('*')
    .eq('country', userCountry)
    .order('rating', { ascending: false });

  return data;
}
```

### 5. Route to Correct Payment Gateway

```tsx
// Automatically select payment gateway
import { getPaymentGateway } from '@/lib/countries';

function PaymentComponent({ userCountry }: { userCountry: string }) {
  const gateway = getPaymentGateway(userCountry as CountryCode);

  if (gateway === 'paystack') {
    return <PaystackPayment />;
  }

  return <StripePayment />;
}
```

---

## Phone Number Examples

### Nigeria
- **Input**: `08012345678` or `2348012345678`
- **Normalized**: `+2348012345678`
- **Formatted**: `+234 801 234 5678`

### USA
- **Input**: `2025551234` or `(202) 555-1234`
- **Normalized**: `+12025551234`
- **Formatted**: `+1 (202) 555-1234`

---

## Testing

### Test Signup (Nigeria)
1. Go to signup page
2. Select "Nigeria"
3. Enter phone: `08012345678`
4. Fill other fields
5. Submit
6. Check database - phone should be stored as `+2348012345678`

### Test Signup (USA)
1. Go to signup page
2. Select "United States"
3. Enter phone: `2025551234`
4. Fill other fields
5. Submit
6. Check database - phone should be stored as `+12025551234`

### Test Login
1. Go to login page
2. Select country
3. Choose "Phone" tab
4. Enter phone number
5. Enter password
6. Should login successfully

---

## Adding New Countries

### Step 1: Update `lib/countries.ts`

```tsx
export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  // ... existing
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    dialCode: '+254',
    phoneFormat: '+254 XXX XXX XXX',
    phoneRegex: /^(\+254|0)[7]\d{8}$/,
    phoneLength: 9,
    currency: 'KES',
    currencySymbol: 'KSh',
    paymentGateway: 'stripe',
    timezone: 'Africa/Nairobi',
  },
};
```

### Step 2: Update Database

```sql
INSERT INTO countries (code, name, dial_code, currency, payment_gateway, timezone) VALUES
  ('KE', 'Kenya', '+254', 'KES', 'stripe', 'Africa/Nairobi');
```

### Step 3: Done!

Components automatically support the new country.

---

## Files Created

```
lib/
  └── countries.ts                          # Core country config

app/components/
  ├── CountrySelector.tsx                   # Country dropdown
  ├── PhoneInput.tsx                        # Smart phone input
  ├── MultiCountrySignupForm.tsx            # Signup form
  └── MultiCountryLoginForm.tsx             # Login form

app/api/auth/
  └── signup-multi-country/route.ts         # Signup API

supabase/migrations/
  └── add_multi_country_support.sql         # Database schema

Documentation/
  ├── MULTI_COUNTRY_SYSTEM_GUIDE.md         # Complete guide
  └── MULTI_COUNTRY_QUICK_START.md          # This file
```

---

## Key Features

✅ **Phone Formatting**
- Auto-formats as user types
- Country-specific format
- Visual validation feedback

✅ **Phone Validation**
- Real-time validation
- Country-specific rules
- Prevents invalid numbers

✅ **Country Detection**
- Auto-detects from IP on first load
- User can override
- Remembers selection

✅ **Payment Gateway Routing**
- Nigeria → Paystack
- USA → Stripe
- Automatic based on country

✅ **Duplicate Prevention**
- Email unique globally
- Phone unique per country
- Prevents account conflicts

✅ **Scalable Design**
- Add countries in 2 steps
- No code changes needed
- Centralized configuration

---

## Troubleshooting

### Phone validation fails
- Verify country is selected
- Check phone format matches country
- Try without country code

### Duplicate phone error
- Phone is unique per country
- Same phone can exist in different countries
- Check if user already exists

### Payment gateway not working
- Verify user's country in database
- Check payment gateway keys in `.env`
- Ensure correct gateway is configured

---

## Next Steps

1. ✅ Update signup page with `MultiCountrySignupForm`
2. ✅ Update login page with `MultiCountryLoginForm`
3. ✅ Run database migration
4. ✅ Test signup/login with both countries
5. ✅ Implement payment gateway routing
6. ✅ Filter braiders by user's country
7. ✅ Add more countries as needed

---

## Support

For detailed documentation, see: `MULTI_COUNTRY_SYSTEM_GUIDE.md`

For API details, see: `app/api/auth/signup-multi-country/route.ts`

For component usage, see: Individual component files
