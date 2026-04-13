# ACTION CARD: Braider Login Fix - Session 6

## PROBLEM
Braiders (both previously registered and newly registered) are seeing the customer dashboard (`/dashboard`) instead of the braider dashboard (`/braider/dashboard`).

## ROOT CAUSE ANALYSIS
The issue is likely that the `profiles` table doesn't have the correct `role='braider'` for braider users. When they log in:
1. Auth store fetches the profile
2. If profile.role is not 'braider', it defaults to 'customer'
3. User gets redirected to customer dashboard

## SOLUTION IMPLEMENTED

### 1. Enhanced Auth Store (`store/supabaseAuthStore.ts`)
- Added comprehensive logging to track role assignment
- Improved error handling and retry logic
- Better fallback when profile doesn't exist

### 2. Enhanced Login Form (`app/components/MultiCountryLoginForm.tsx`)
- Added fallback check: if role is 'customer' but user has `braider_profiles` record, update role to 'braider'
- Better logging to track the redirect decision
- Ensures correct redirect based on actual role

### 3. Database Fix Script (`FIX_BRAIDER_ROLES.sql`)
- Verifies all braiders have `role='braider'` in profiles table
- Updates any braiders with wrong role
- Validates the fix

## IMMEDIATE ACTIONS REQUIRED

### Step 1: Run Database Fix
Go to Supabase SQL Editor and run:
```sql
-- Fix braider roles in profiles table
UPDATE profiles 
SET role = 'braider', updated_at = NOW()
WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles)
AND role != 'braider';

-- Verify the fix
SELECT COUNT(*) as braiders_with_correct_role FROM profiles 
WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles)
AND role = 'braider';
```

### Step 2: Test the Fix
1. **Test existing braider login:**
   - Log in with a previously registered braider account
   - Should see `/braider/dashboard`
   - Check browser console for role logs

2. **Test new braider signup:**
   - Sign up as a new braider
   - Complete all signup steps
   - Should be redirected to `/braider/dashboard`
   - Check browser console for role logs

3. **Test customer login:**
   - Log in with a customer account
   - Should see `/dashboard`
   - Verify no redirect issues

### Step 3: Deploy to Vercel
```bash
git push origin master
```

## VERIFICATION CHECKLIST

- [ ] Database fix applied (braiders have role='braider')
- [ ] Existing braider can log in and see braider dashboard
- [ ] New braider signup works and redirects correctly
- [ ] Customer login still works correctly
- [ ] Admin login still works correctly
- [ ] Browser console shows correct role logs
- [ ] Changes deployed to Vercel

## FILES CHANGED
- `store/supabaseAuthStore.ts` - Enhanced logging and error handling
- `app/components/MultiCountryLoginForm.tsx` - Added fallback role check
- `FIX_BRAIDER_ROLES.sql` - Database fix script

## GIT COMMIT
- Commit: `bac940c` - "Fix: Improve braider login role detection with better logging and fallback checks"

## NEXT STEPS IF ISSUE PERSISTS
1. Check browser console logs during login to see role assignment
2. Verify profiles table has correct role values
3. Check if RLS policies are blocking profile reads
4. Verify braider_profiles table has correct user_id references
