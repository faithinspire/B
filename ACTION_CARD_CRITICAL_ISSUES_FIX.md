# ACTION CARD: Critical Issues - Immediate Fixes Required

## Three Critical Issues to Fix NOW

### ❌ Issue 1: Braiders Registered But Not Showing in Supabase
**Status**: NEEDS IMMEDIATE FIX

**What to do:**
1. Go to Supabase SQL Editor
2. Run this SQL:
```sql
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON braider_profiles TO authenticated;
GRANT ALL ON braider_profiles TO anon;
GRANT ALL ON braider_profiles TO service_role;
```

3. Then run this to check if braiders exist:
```sql
SELECT id, user_id, full_name, email, verification_status 
FROM braider_profiles 
ORDER BY created_at DESC 
LIMIT 20;
```

4. If no braiders show up, run this to create them from profiles table:
```sql
INSERT INTO braider_profiles (user_id, full_name, email, country, verification_status, avatar_url, rating_avg, rating_count, travel_radius_miles, is_mobile, total_earnings, available_balance, verified)
SELECT 
  p.id, p.full_name, p.email, COALESCE(p.country, 'NG'), 'pending', NULL, 5.0, 0, 10, true, 0, 0, false
FROM profiles p
WHERE p.role = 'braider' AND p.id NOT IN (SELECT user_id FROM braider_profiles)
ON CONFLICT (user_id) DO NOTHING;
```

5. Refresh `/admin/braiders` page - braiders should now appear

---

### ❌ Issue 2: Can't Add People as Admin
**Status**: NEEDS IMMEDIATE FIX

**What to do:**
1. Go to Supabase SQL Editor
2. Get the exact emails of people you want to make admin:
```sql
SELECT email, full_name, role FROM profiles ORDER BY created_at DESC LIMIT 50;
```

3. Copy the exact emails (e.g., james@yahoo.com, daisy@yahoo.com)
4. Run this SQL with YOUR emails:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'james@yahoo.com',
  'daisy@yahoo.com',
  'third-person@email.com'
);
```

5. Verify it worked:
```sql
SELECT email, role FROM profiles WHERE role = 'admin';
```

6. **IMPORTANT**: Have the new admins:
   - Log out completely
   - Log back in
   - They should now see admin dashboard at `/admin`

---

### ❌ Issue 3: Not Receiving Verification/Password Reset Emails
**Status**: NEEDS IMMEDIATE FIX

**What to do:**

**Step A: Verify Resend Domain**
1. Go to https://resend.com/domains
2. Check if `braidme.com` is listed and verified
3. If NOT verified:
   - Click "Add Domain"
   - Add `braidme.com`
   - Follow DNS verification steps
   - Wait 5-10 minutes for verification

**Step B: Test Email Sending**
1. Open terminal/command prompt
2. Run this command:
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

3. Check your email inbox (and spam folder) for the reset link

**Step C: Check Resend Logs**
1. Go to https://resend.com/emails
2. Look for recent emails
3. Check if they show as "Sent", "Delivered", or "Failed"
4. If "Failed", see the error message

**Step D: If Domain Still Not Verified**
- Temporarily use Resend's test domain
- Edit `app/api/auth/forgot-password/route.ts`
- Change `from: 'noreply@braidme.com'` to `from: 'onboarding@resend.dev'`
- Commit and push to Vercel
- Test again

---

## Quick Checklist

### For Braiders Issue:
- [ ] Disabled RLS on braider_profiles
- [ ] Checked if braiders exist in database
- [ ] Created missing braider_profiles records if needed
- [ ] Refreshed admin braiders page
- [ ] Braiders now showing ✅

### For Admin Issue:
- [ ] Got exact emails of people to make admin
- [ ] Ran UPDATE query with correct emails
- [ ] Verified role was updated in database
- [ ] Had users log out and back in
- [ ] Users can now access `/admin` ✅

### For Email Issue:
- [ ] Verified `braidme.com` domain in Resend
- [ ] Tested email sending with curl command
- [ ] Checked Resend email logs
- [ ] Received test email ✅

---

## Expected Results After Fixes

### Braiders Page
- ✅ All braiders appear in `/admin/braiders`
- ✅ Can search and filter braiders
- ✅ Braiders show with correct status

### Admin Access
- ✅ New admins can log in
- ✅ New admins see `/admin` dashboard
- ✅ New admins can manage users, braiders, barbers

### Email Delivery
- ✅ Password reset emails arrive in inbox
- ✅ Verification emails are received
- ✅ Email links work correctly

---

## If Issues Still Persist

### Braiders Still Not Showing:
- Check browser console for errors
- Check Vercel logs for signup endpoint
- Verify `braider_profiles` table exists

### Admin Still Can't Access:
- Verify role was updated: `SELECT email, role FROM profiles WHERE email = 'their-email@example.com';`
- Have them clear browser cache
- Have them try incognito/private window
- Check `/admin` layout code for role check

### Emails Still Not Received:
- Check Resend logs for "Failed" status
- Verify API key is correct in `.env.local`
- Try sending from `onboarding@resend.dev` temporarily
- Check spam/junk folder
- Add sender to contacts to whitelist

---

## Support

If you need help:
1. Share the exact error message
2. Share the SQL query you ran
3. Share the Resend error (if any)
4. Share browser console errors (if any)

**Status**: Ready to fix ✅
