# Multi-Country Authentication & User System

## Overview

A scalable, modular multi-country authentication system supporting Nigeria (NG) and United States (US) with country-specific phone formatting, validation, and payment gateway integration.

---

## Architecture

### Core Components

1. **`lib/countries.ts`** - Centralized country configuration
   - Country definitions (code, name, phone format, currency, payment gateway)
   - Phone number normalization and validation
   - Country detection from IP
   - Payment gateway routing

2. **`app/components/CountrySelector.tsx`** - Country selection UI
   - Dropdown with flags and country info
   - Auto-detection on first load
   - Easy to extend for new countries

3. **`app/components/PhoneInput.tsx`** - Smart phone input
   - Country-specific formatting
   - Real-time validation
   - Visual feedback (valid/invalid)
   - Automatic format on blur

4. **`app/components/MultiCountrySignupForm.tsx`** - Signup form
   - Country selection
   - Phone number input with validation
   - Password confirmation
   - Error handling

5. **`app/components/MultiCountryLoginForm.tsx`** - Login form
   - Email or phone login
   - Country-specific phone validation
   - Seamless authentication

6. **`app/api/auth/signup-multi-country/route.ts`** - Backend signup API
   - User creation with country info
   - Phone number normalization
   - Duplicate prevention (email + country)
   - Profile creation with currency and payment gateway

---

## Database Schema

### profiles table additions

```sql
ALTER TABLE profiles ADD COLUMN country VARCHAR(2) DEFAULT 'NG';
ALTER TABLE profiles ADD COLUMN phone_normalized VARCHAR(20);
ALTER TABLE profiles ADD COLUMN currency VARCHAR(3) DEFAULT 'NGN';
ALTER TABLE profiles ADD COLUMN payment_gateway VARCHAR(20) DEFAULT 'paystack';
```

### braider_profiles table additions

```sql
ALTER TABLE braider_profiles ADD COLUMN country VARCHAR(2) DEFAULT 'NG';
```

### countries reference table

```sql
CREATE TABLE countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dial_code VARCHAR(5) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_gateway VARCHAR(20) NOT NULL,
  timezone VARCHAR(50) NOT NULL
);
```

---

## Supported Countries

### Nigeria (NG)
- **Dial Code**: +234
- **Phone Format**: +234 801 234 5678
- **Input Examples**: 08012345678, 2348012345678, +2348012345678
- **Currency**: NGN (₦)
- **Payment Gateway**: Paystack
- **Timezone**: Africa/Lagos

### United States (US)
- **Dial Code**: +1
- **Phone Format**: +1 (202) 555-1234
- **Input Examples**: 2025551234, 12025551234, +12025551234
- **Currency**: USD ($)
- **Payment Gateway**: Stripe
- **Timezone**: America/New_York

---

## Usage Examples

### 1. Country Selector Component

```tsx
import { CountrySelector } from '@/app/components/CountrySelector';
import { useState } from 'react';

export function MyComponent() {
  const [country, setCountry] = useState<CountryCode>('NG');

  return (
    <CountrySelector
      value={country}
      onChange={setCountry}
      label="Select Your Country"
    />
  );
}
```

### 2. Phone Input Component

```tsx
import { PhoneInput } from '@/app/components/PhoneInput';
import { useState } from 'react';

export function MyComponent() {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<CountryCode>('NG');

  return (
    <PhoneInput
      value={phone}
      onChange={setPhone}
      country={country}
      label="Phone Number"
      required
    />
  );
}
```

### 3. Phone Number Normalization

```tsx
import { normalizePhoneNumber, formatPhoneNumber } from '@/lib/countries';

// Normalize: "08012345678" → "+2348012345678"
const normalized = normalizePhoneNumber('08012345678', 'NG');

// Format: "+2348012345678" → "+234 801 234 5678"
const formatted = formatPhoneNumber(normalized, 'NG');
```

### 4. Phone Validation

```tsx
import { validatePhoneNumber } from '@/lib/countries';

const isValid = validatePhoneNumber('+2348012345678', 'NG');
// true

const isInvalid = validatePhoneNumber('+2348012345678', 'US');
// false
```

### 5. Get Payment Gateway

```tsx
import { getPaymentGateway } from '@/lib/countries';

const gateway = getPaymentGateway('NG');
// 'paystack'

const gateway = getPaymentGateway('US');
// 'stripe'
```

### 6. Signup Form

```tsx
import { MultiCountrySignupForm } from '@/app/components/MultiCountrySignupForm';

export function SignupPage() {
  return (
    <MultiCountrySignupForm
      userType="customer"
      onSuccess={() => console.log('Signup successful!')}
    />
  );
}
```

### 7. Login Form

```tsx
import { MultiCountryLoginForm } from '@/app/components/MultiCountryLoginForm';

export function LoginPage() {
  return (
    <MultiCountryLoginForm
      onSuccess={() => console.log('Login successful!')}
    />
  );
}
```

---

## API Endpoints

### POST /api/auth/signup-multi-country

Create a new user account with country-specific information.

**Request:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "phone_country": "NG",
  "password": "SecurePassword123",
  "role": "customer"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user-uuid",
    "email": "john@example.com",
    "country": "NG",
    "currency": "NGN",
    "paymentGateway": "paystack"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid phone number for selected country"
}
```

---

## Filtering by Country

### Get Braiders in User's Country

```tsx
import { supabase } from '@/lib/supabase';

async function getBraidersInCountry(userCountry: string) {
  const { data, error } = await supabase
    .from('braider_profiles')
    .select('*')
    .eq('country', userCountry)
    .order('rating', { ascending: false });

  return data;
}
```

### Get Users by Country

```tsx
async function getUsersByCountry(country: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('country', country);

  return data;
}
```

---

## Payment Gateway Integration

### Automatic Gateway Selection

```tsx
import { getPaymentGateway } from '@/lib/countries';

function PaymentComponent({ userCountry }: { userCountry: string }) {
  const gateway = getPaymentGateway(userCountry as CountryCode);

  if (gateway === 'paystack') {
    return <PaystackPayment />;
  }

  if (gateway === 'stripe') {
    return <StripePayment />;
  }
}
```

### Paystack Integration (Nigeria)

```tsx
import { usePaystackPayment } from 'react-paystack';

export function PaystackPayment() {
  const config = {
    reference: new Date().getTime().toString(),
    email: userEmail,
    amount: amount * 100, // Paystack uses kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button onClick={() => initializePayment()}>
      Pay with Paystack
    </button>
  );
}
```

### Stripe Integration (USA)

```tsx
import { loadStripe } from '@stripe/stripe-js';

export async function StripePayment() {
  const stripe = await loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );

  const { error } = await stripe!.redirectToCheckout({
    sessionId: checkoutSessionId,
  });
}
```

---

## Scaling to New Countries

### Step 1: Add Country Configuration

Edit `lib/countries.ts`:

```tsx
export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  // ... existing countries
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
    paymentGateway: 'stripe', // or 'paystack'
    timezone: 'Africa/Nairobi',
  },
};
```

### Step 2: Update Database

```sql
INSERT INTO countries (code, name, dial_code, currency, payment_gateway, timezone) VALUES
  ('KE', 'Kenya', '+254', 'KES', 'stripe', 'Africa/Nairobi');
```

### Step 3: Test

The components automatically support the new country!

```tsx
<CountrySelector value="KE" onChange={setCountry} />
<PhoneInput country="KE" value={phone} onChange={setPhone} />
```

---

## Testing

### Test Users

**Nigeria Customer:**
- Email: `customer.ng@test.com`
- Phone: `08012345678`
- Country: NG
- Currency: NGN
- Payment: Paystack

**USA Customer:**
- Email: `customer.us@test.com`
- Phone: `2025551234`
- Country: US
- Currency: USD
- Payment: Stripe

**Nigeria Braider:**
- Email: `braider.ng@test.com`
- Phone: `09012345678`
- Country: NG
- Currency: NGN
- Payment: Paystack

### Test Scenarios

1. **Signup with Nigeria phone**
   - Input: `08012345678`
   - Expected: Normalized to `+2348012345678`
   - Formatted: `+234 801 234 5678`

2. **Signup with USA phone**
   - Input: `(202) 555-1234`
   - Expected: Normalized to `+12025551234`
   - Formatted: `+1 (202) 555-1234`

3. **Login with phone (Nigeria)**
   - Select Nigeria
   - Enter phone: `08012345678`
   - System finds user by normalized phone

4. **Payment gateway routing**
   - Nigeria user → Paystack
   - USA user → Stripe

---

## Security Considerations

1. **Phone Number Storage**
   - Always store in normalized international format
   - Use `phone_normalized` column for lookups
   - Keep original `phone` for display

2. **Duplicate Prevention**
   - Check email globally (unique across all countries)
   - Check phone per country (same phone can exist in different countries)

3. **Country Validation**
   - Validate phone format matches selected country
   - Prevent users from changing country after signup (or require verification)

4. **Payment Gateway**
   - Automatically route to correct gateway based on country
   - Store gateway preference in profile
   - Validate payment currency matches user currency

---

## Performance Optimization

1. **Indexes**
   ```sql
   CREATE INDEX idx_profiles_country ON profiles(country);
   CREATE INDEX idx_profiles_phone_normalized ON profiles(phone_normalized);
   CREATE INDEX idx_braider_profiles_country ON braider_profiles(country);
   ```

2. **Caching**
   - Cache country configurations in memory
   - Cache user country preference in session

3. **Lazy Loading**
   - Load payment gateway libraries only when needed
   - Load country-specific components on demand

---

## Troubleshooting

### Phone validation fails

**Issue**: Phone number shows as invalid
**Solution**: 
- Verify country is selected correctly
- Check phone format matches country
- Try entering without country code (e.g., `08012345678` for Nigeria)

### Duplicate phone error

**Issue**: "Phone number already registered"
**Solution**:
- Phone is unique per country
- Same phone can exist in different countries
- Check if user already exists in selected country

### Payment gateway not routing correctly

**Issue**: Wrong payment gateway selected
**Solution**:
- Verify user's country in database
- Check `payment_gateway` column in profiles
- Ensure payment gateway keys are configured in `.env`

---

## Future Enhancements

1. **OTP Verification**
   - Send OTP to phone number during signup
   - Verify before account activation

2. **Phone Number Portability**
   - Allow users to change phone number
   - Require verification of new number

3. **Multi-Currency Support**
   - Display prices in user's currency
   - Real-time exchange rates

4. **Regional Compliance**
   - GDPR for EU countries
   - CCPA for USA
   - Local data residency requirements

5. **More Countries**
   - Ghana, Kenya, South Africa (Africa)
   - Canada, Mexico (North America)
   - UK, Germany, France (Europe)

---

## Summary

This multi-country system is:
- ✅ **Modular**: Easy to add new countries
- ✅ **Scalable**: Handles millions of users
- ✅ **Secure**: Proper validation and duplicate prevention
- ✅ **User-Friendly**: Smart phone input with auto-formatting
- ✅ **Developer-Friendly**: Centralized configuration
- ✅ **Production-Ready**: Error handling and logging
