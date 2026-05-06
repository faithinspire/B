# IMMEDIATE ACTION CARD - FINAL FIX

## Status: Ready to Execute

### Three Tasks to Complete (5 minutes total)

---

## TASK 1: Run SQL Migration (2 minutes)

**Go to**: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

**Copy & Paste This SQL**:
```sql
-- Add missing columns to braider_profiles table
ALTER TABLE braider_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);

-- Add phone column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for fast featured braider queries
CREATE INDEX IF NOT EXISTS idx_braider_profiles_featured 
  ON braider_profiles(is_premium DESC, featured_order DESC, rating_avg DESC);

-- Verify migration completed
SELECT 'Migration completed successfully!' AS status;
```

**Click**: Run button (or Ctrl+Enter)

**Expected**: "Migration completed successfully!" message

---

## TASK 2: Fix Admin Role (1 minute)

**Go to**: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

**Copy & Paste This SQL**:
```sql
-- Fix Admin Role for damilola@gmail.com
UPDATE profiles 
SET role = 'admin', updated_at = NOW() 
WHERE email = 'damilola@gmail.com';

-- Verify the update
SELECT id, email, role, updated_at FROM profiles WHERE email = 'damilola@gmail.com';
```

**Click**: Run button

**Expected**: Should show 1 row with role = 'admin'

---

## TASK 3: Restart Dev Server (1 minute)

**In Terminal**:
```bash
# Stop current server (Ctrl+C)
# Then run:
npm run dev
```

**Expected**: Server starts on http://localhost:3001

---

## TASK 4: Test Everything (1 minute)

### Test 1: Homepage Featured Braiders
- Go to: http://localhost:3001
- Scroll to "Featured Braiders" section
- Should see braider cards in carousel
- ✅ If braiders display = SUCCESS

### Test 2: Admin Dashboard
- Go to: http://localhost:3001/admin/dashboard
- Login with: damilola@gmail.com
- Should show admin dashboard (not customer page)
- ✅ If admin page shows = SUCCESS

### Test 3: Admin Users Page
- Go to: http://localhost:3001/admin/users
- Should show table with all users
- Should see phone numbers in table
- ✅ If phone numbers display = SUCCESS

---

## If Something Doesn't Work

### Braiders Not Showing
- Check browser console for errors
- Check dev server logs for API errors
- Verify SQL migration ran successfully

### Admin Dashboard Still Shows Customer Page
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Logout and login again
- Check that role = 'admin' in database

### Phone Numbers Not Showing
- Verify SQL migration added phone column
- Check admin users API response includes phone field
- Refresh page

---

## Success Checklist

- [ ] SQL migration ran without errors
- [ ] Admin role updated to 'admin'
- [ ] Dev server restarted
- [ ] Braiders display on homepage
- [ ] Admin dashboard shows correct page
- [ ] Admin users page shows phone numbers

---

**Time to Complete**: 5 minutes
**Difficulty**: Easy (copy & paste)
**Result**: All three issues fixed ✅

