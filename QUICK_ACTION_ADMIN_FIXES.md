# Quick Action: Admin Dashboard Fixes

## ✅ What's Done
- Code fixes deployed to production
- Braiders page: Graceful error handling ✅
- Users page: Graceful error handling ✅
- Vercel deployment: In progress ✅

## ⏳ What You Need to Do

### 1. Run SQL in Supabase (5 minutes)

Go to: https://app.supabase.com → SQL Editor → New Query

**Copy and paste this entire SQL block:**

```sql
-- Add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2);
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Sync data
UPDATE braider_profiles bp SET email = p.email FROM profiles p WHERE bp.user_id = p.id AND bp.email IS NULL;
UPDATE braider_profiles bp SET full_name = p.full_name FROM profiles p WHERE bp.user_id = p.id AND bp.full_name IS NULL;
UPDATE braider_profiles bp SET phone = p.phone FROM profiles p WHERE bp.user_id = p.id AND bp.phone IS NULL;
UPDATE braider_profiles bp SET avatar_url = p.avatar_url FROM profiles p WHERE bp.user_id = p.id AND bp.avatar_url IS NULL;

-- Disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON braider_profiles TO authenticated;
GRANT ALL ON braider_profiles TO anon;
GRANT ALL ON braider_profiles TO service_role;
GRANT ALL ON password_reset_tokens TO authenticated;
GRANT ALL ON password_reset_tokens TO anon;
GRANT ALL ON password_reset_tokens TO service_role;
```

Click **Run** → Wait for success ✅

---

### 2. Set Admin Emails (2 minutes)

**In the same SQL Editor, run this:**

```sql
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

**Replace the emails with your actual admin emails!**

---

### 3. Test (2 minutes)

1. Clear browser cache (Ctrl+Shift+Delete)
2. Log in as admin
3. Check:
   - ✅ Braiders page loads
   - ✅ Users page loads
   - ✅ Dashboard shows stats
   - ✅ No error messages

---

## Expected Results

| Page | Before | After |
|------|--------|-------|
| Braiders | ❌ "Failed to fetch" | ✅ Shows list or empty |
| Users | ❌ "Column error" | ✅ Shows list or empty |
| Dashboard | ⚠️ Partial | ✅ Full functionality |

---

## If Issues Persist

1. Verify SQL ran successfully (no error messages)
2. Check browser console (F12 → Console)
3. Clear cache completely
4. Try incognito mode
5. Wait 2-3 minutes for Vercel deployment

---

## Barber Section

✅ Already exists as **"Braiders"** in admin dashboard navigation

---

**Status**: Code deployed ✅ | Waiting for your SQL execution ⏳
