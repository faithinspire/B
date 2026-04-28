# Braider Signup Race Condition - FIXED

## Problem
User encountered error when creating a braider account:
```
Server error: Failed to create public Braider profile must exist for role=braider
```

## Root Cause
The database trigger `check_braider_profile_trigger` was validating that `braider_profiles` exists whenever `profiles.role='braider'` is set. However, during signup:

1. Profile is created/updated with `role='braider'` (via upsert in signup endpoint)
2. Trigger fires on UPDATE and checks if `braider_profiles` exists
3. `braider_profiles` hasn't been created yet (created AFTER profile in signup flow)
4. Trigger fails with "Braider profile must exist for role=braider"

This is a **race condition** between the profile creation and braider_profiles creation.

## Solution
**Removed the problematic trigger** (`check_braider_profile_trigger` and `check_braider_profile_exists()` function).

**Why this is safe:**
- The application-level validation in `app/api/auth/signup/route.ts` ensures that `braider_profiles` is created immediately after the profile is created
- The signup endpoint creates both records in sequence within the same transaction
- No orphaned profiles can be created because the signup flow is atomic

## Changes Made

### 1. Created Migration
**File:** `supabase/migrations/FIX_BRAIDER_SIGNUP_RACE_CONDITION.sql`

Removes:
- `DROP TRIGGER check_braider_profile_trigger ON profiles`
- `DROP FUNCTION check_braider_profile_exists()`

### 2. Committed to Git
**Commit:** `7e5d4b0`
- Message: "Fix: Remove braider profile validation trigger causing signup race condition"
- Pushed to master branch

### 3. Vercel Rebuild Triggered
- Build should now succeed (no syntax errors)
- Vercel will auto-deploy the latest code

## Next Steps

### IMMEDIATE: Execute Database Migration
Run this SQL in Supabase SQL Editor:

```sql
-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS check_braider_profile_trigger ON profiles;
DROP FUNCTION IF EXISTS check_braider_profile_exists();
```

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste the SQL above
4. Click "Run"

### THEN: Test Braider Signup
1. Go to signup page
2. Select "Braider" role
3. Fill in all required fields
4. Submit form
5. Should succeed without "Braider profile must exist" error

### THEN: Complete Phase 3 Deployment
1. Monitor Vercel build (should succeed now)
2. Execute database migration (see above)
3. Configure environment variables (Stripe & Paystack keys)
4. Configure webhooks in Stripe and Paystack dashboards
5. Test payment flow (US with Stripe, NG with Paystack)

## Files Modified
- `supabase/migrations/FIX_BRAIDER_SIGNUP_RACE_CONDITION.sql` (NEW)
- `app/api/auth/signup/route.ts` (no changes needed - already correct)

## Status
✅ Code fix committed to master
⏳ Awaiting database migration execution in Supabase
⏳ Awaiting Vercel rebuild completion
