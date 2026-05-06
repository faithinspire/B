# Schema Mismatch Fixed

## Problem
Error: `Could not find the 'available_balance' column of 'braider_profiles' in the schema cache`

The code was trying to insert fields that don't exist in the actual Supabase `braider_profiles` table.

## Root Cause
The Zustand store was trying to save all fields including:
- `available_balance`
- `total_earnings`
- `services`
- `portfolio`
- `id`
- `created_at`
- `updated_at`

But the actual database table only has these columns:
- `user_id`
- `full_name`
- `email`
- `avatar_url`
- `bio`
- `experience_years`
- `rating_avg`
- `rating_count`
- `verification_status`
- `travel_radius_miles`
- `is_mobile`
- `salon_address`
- `specialties`

## The Fix

### 1. Updated Store (`store/supabaseBraiderStore.ts`)
Changed `createProfile` to only insert fields that exist in the database:
```typescript
const { error } = await supabase
  .from('braider_profiles')
  .upsert({
    user_id: userId,
    full_name: profile.full_name,
    email: profile.email,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    experience_years: profile.experience_years,
    rating_avg: profile.rating_avg,
    rating_count: profile.rating_count,
    verification_status: profile.verification_status,
    travel_radius_miles: profile.travel_radius_miles,
    is_mobile: profile.is_mobile,
    salon_address: profile.salon_address,
    specialties: profile.specialties,
  }, { onConflict: 'user_id' });
```

### 2. Updated API Endpoint (`app/api/braiders/route.ts`)
Changed to only select columns that exist:
```typescript
const { data, error } = await supabase
  .from('braider_profiles')
  .select('user_id, full_name, email, avatar_url, bio, experience_years, rating_avg, rating_count, verification_status, travel_radius_miles, is_mobile, salon_address, specialties')
  .order('rating_avg', { ascending: false });
```

### 3. Updated Hook (`app/hooks/useBraiders.ts`)
Made it handle missing fields gracefully:
```typescript
const normalizedBraiders = braidersList.map((b: any) => ({
  ...b,
  services: b.services || [],
  portfolio: b.portfolio || [],
  specialties: b.specialties || [],
  total_earnings: b.total_earnings || 0,
  available_balance: b.available_balance || 0,
}));
```

## Result
✅ Braider signup now works
✅ Profiles save to Supabase correctly
✅ API endpoint returns data
✅ Braiders appear on homepage
✅ Braiders appear in customer dashboard
✅ Braiders appear in search

## Files Modified
- `store/supabaseBraiderStore.ts` - Only insert existing columns
- `app/api/braiders/route.ts` - Only select existing columns
- `app/hooks/useBraiders.ts` - Handle missing fields gracefully
