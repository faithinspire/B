# CRITICAL ISSUES - DIAGNOSIS AND FIX

## Issue 1: Braiders Registered But Not Found in Supabase

### Problem
- User says: "I am trying to add some braiders with their emails and it's telling me they have registered and I can't find them in the Supabase"
- Braiders appear to be created but don't show up in the database

### Root Causes Identified

1. **RLS (Row Level Security) Policies Blocking Reads**
   - Even though data is being inserted, RLS policies might be preventing you from seeing it
   - The braider_profiles table might have RLS enabled that blocks SELECT queries

2. **Data Not Being Inserted to braider_profiles Table**
   - The signup route creates a profile in `profiles` table
   - But for braiders, it also needs to create a record in `braider_profiles` table
   - If this insert fails silently, braiders won't appear in the braiders list

3. **Verification Status Issue**
   - Braiders are created with `verification_status = 'pending'`
   - The admin braiders page might be filtering by status

### Solution

**Step 1: Disable RLS on braider_profiles table**

Run this SQL in Supabase SQL Editor:

```sql
-- Disable RLS on braider_profiles table
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON braider_profiles TO authenticated;
GRANT ALL ON braider_profiles TO anon;
GRANT ALL ON braider_profiles TO service_role;

-- Verify
SELECT * FROM braider_profiles LIMIT 10;
```

**Step 2: Check if braiders are actually in the database**

Run this query in Supabase SQL Editor:

```sql
-- Check all braiders (including pending)
SELECT id, user_id, full_name, email, verification_status, profession_type, created_at 
FROM braider_profiles 
ORDER BY created_at DESC 
LIMIT 20;

-- Check profiles table
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role = 'braider' 
ORDER BY created_at DESC 
LIMIT 20;
```

**Step 3: If braiders are in profiles but not in braider_profiles**

Run this SQL to create missing braider_profiles records:

```sql
-- Create braider_profiles for braiders that don't have one
INSERT INTO braider_profiles (user_id, full_name, email, country, verification_status, avatar_url, rating_avg, rating_count, travel_radius_miles, is_mobile, total_earnings, available_balance, verified)
SELECT 
  p.id,
  p.full_name,
  p.email,
  COALESCE(p.country, 'NG'),
  'pending',
  NULL,
  5.0,
  0,
  10,
  true,
  0,
  0,
  false
FROM profiles p
WHERE p.role = 'braider' 
  AND p.id NOT IN (SELECT user_id FROM braider_profiles)
ON CONFLICT (user_id) DO NOTHING;
```

---

## Issue 2: Can't Add People as Admin

### Problem
- User says: "I can't still add some people as admin"
- The SQL script for making users admin isn't working

### Root Cause
The SQL file `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` has placeholder emails that need to be replaced:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IS NOT NULL AND email IN (
  'your-email-1@gmail.com',    -- ← NEEDS TO BE REPLACED
  'your-email-2@gmail.com',    -- ← NEEDS TO BE REPLACED
  'your-email-3@gmail.com'     -- ← NEEDS TO BE REPLACED
);
```

### Solution

**Step 1: Get the exact emails of people you want to make admin**

Run this in Supabase SQL Editor to see all users:

```sql
SELECT id, email, full_name, role 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 50;
```

**Step 2: Make specific users admin**

Replace the emails and run this SQL:

```sql
-- Make specific users admin
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'james@yahoo.com',
  'daisy@yahoo.com',
  'your-third-admin@email.com'
);

-- Verify
SELECT email, role FROM profiles WHERE role = 'admin';
```

**Step 3: If users still can't access admin dashboard**

They need to log out and log back in for the role change to take effect:

1. User logs out
2. User logs back in
3. System fetches fresh role from database
4. User should now see admin dashboard

---

## Issue 3: Not Receiving Verification/Password Reset Emails

### Problem
- User says: "I am not receiving verification mails in my mail"
- Password reset emails not being delivered

### Root Causes

1. **Resend Domain Not Verified**
   - The email is being sent from `noreply@braidme.com`
   - But the domain `braidme.com` might not be verified in Resend
   - Unverified domains can't send emails

2. **Resend API Key Issues**
   - API key might be invalid or revoked
   - API key might not have permission to send emails

3. **Email Filtering**
   - Emails might be going to spam folder
   - Gmail/Outlook might be blocking them

### Solution

**Step 1: Verify Resend Domain**

1. Go to https://resend.com/domains
2. Check if `braidme.com` is listed
3. If not listed or not verified:
   - Add the domain
   - Follow verification steps (add DNS records)
   - Wait for verification (usually 5-10 minutes)

**Step 2: Test Email Sending**

Run this in your terminal to test if emails are being sent:

```bash
# Test password reset endpoint
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

Check the response for errors.

**Step 3: Check Resend Email Logs**

1. Go to https://resend.com/emails
2. Look for recent emails
3. Check if they show as "Sent", "Delivered", or "Failed"
4. If failed, see the error message

**Step 4: If Domain Not Verified, Use Alternative**

If you can't verify `braidme.com`, use Resend's default domain temporarily:

Update `app/api/auth/forgot-password/route.ts`:

```typescript
// Change from:
from: 'noreply@braidme.com',

// To:
from: 'onboarding@resend.dev',  // Resend's test domain (works immediately)
```

Then test again.

**Step 5: Check Email Spam Folder**

1. Check Gmail spam folder
2. Check Outlook junk folder
3. Add `noreply@braidme.com` to contacts to whitelist

---

## Quick Action Checklist

### For Braiders Not Showing Up:
- [ ] Run: `ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;`
- [ ] Run: `SELECT * FROM braider_profiles LIMIT 10;` to verify data exists
- [ ] If no data, run the INSERT query to create missing records
- [ ] Refresh the braiders page in admin dashboard

### For Admin Assignment:
- [ ] Get exact emails of people to make admin
- [ ] Run UPDATE query with correct emails
- [ ] Have users log out and log back in
- [ ] Verify they can access `/admin` dashboard

### For Email Issues:
- [ ] Go to https://resend.com/domains
- [ ] Verify `braidme.com` is verified
- [ ] If not, add DNS records and wait for verification
- [ ] Test with `curl` command above
- [ ] Check Resend email logs at https://resend.com/emails
- [ ] If still not working, temporarily use `onboarding@resend.dev`

---

## Testing After Fixes

### Test 1: Braiders Visibility
1. Go to `/admin/braiders`
2. Should see all braiders (including pending ones)
3. Search and filter should work

### Test 2: Admin Access
1. Have newly-made admin user log out
2. Have them log back in
3. They should see `/admin` dashboard
4. If not, check browser console for errors

### Test 3: Email Delivery
1. Go to `/forgot-password` page
2. Enter your email
3. Check your inbox (and spam folder)
4. Should receive email within 30 seconds
5. Click link and verify it works

---

## If Issues Persist

### For Braiders:
- Check browser console for API errors
- Check Vercel logs for signup endpoint errors
- Verify `braider_profiles` table exists and has columns

### For Admin:
- Check if user's role is actually updated in database
- Verify user is logging out and back in
- Check if `/admin` layout is checking role correctly

### For Emails:
- Check Resend API key is correct
- Verify domain is verified in Resend
- Check if emails are in Resend logs as "Failed"
- Try sending from `onboarding@resend.dev` temporarily

---

## Summary

**Three Critical Issues:**
1. ✅ Braiders not showing - Fix RLS and check braider_profiles table
2. ✅ Admin assignment - Replace placeholder emails in SQL
3. ✅ Emails not received - Verify Resend domain and check logs

**Next Steps:**
1. Run the SQL commands above
2. Test each feature
3. Report any remaining errors with exact error messages
