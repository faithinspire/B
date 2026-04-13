# ACTION CARD: Fix Braider Dashboard Showing Customer Page

## Problem
The braider dashboard is still showing the customer page instead of the braider dashboard.

## Root Cause
Braiders' roles in the `profiles` table are not set to `'braider'`. They're likely set to `'customer'` or `null`, which causes the role check to fail and redirect them to the customer dashboard.

## Solution

### Step 1: Run SQL to Fix Braider Roles
Go to your Supabase dashboard and run this SQL in the SQL Editor:

```sql
-- Fix braider roles in profiles table
UPDATE profiles
SET role = 'braider', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT user_id FROM braider_profiles
)
AND role != 'braider';
```

This will:
- Find all users who have a `braider_profiles` record
- Update their role in the `profiles` table to `'braider'`
- Skip any that are already set to `'braider'`

### Step 2: Test the Fix
1. Log out completely
2. Log back in as a braider
3. You should now see the braider dashboard instead of the customer dashboard

## How It Works
The braider dashboard page now:
1. Checks if the user's role is `'braider'`
2. If not, it calls the `/api/auth/verify-role` endpoint to fix the role
3. If the role is fixed, it reloads the page
4. If the user is not a braider, it redirects to the customer dashboard

## Code Changes Made
- Updated `app/(braider)/braider/dashboard/page.tsx` to:
  - Call role verification if role is not 'braider'
  - Reload the page if role is fixed
  - Redirect to customer dashboard if user is not a braider

## Verification
After running the SQL, check that:
- All braiders have `role = 'braider'` in the profiles table
- Braiders can now access `/braider/dashboard` and see the braider dashboard
- The role verification endpoint is working correctly
