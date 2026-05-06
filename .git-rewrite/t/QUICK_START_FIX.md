# Quick Start Fix - 10 Minutes to Resolution

## The Problem
1. ❌ Braiders not showing on homepage
2. ❌ Admin dashboard showing customer page
3. ❌ Admin users page missing phone numbers

## The Solution (3 Steps)

### Step 1: Run SQL Migration (2 min)
Go to: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

Paste this:
```sql
ALTER TABLE braider_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE INDEX IF NOT EXISTS idx_braider_profiles_featured 
  ON braider_profiles(is_premium DESC, featured_order DESC, rating_avg DESC);

SELECT 'Done!' AS status;
```

Click "Run" → Wait for "Done!" message

### Step 2: Restart Dev Server (1 min)
```bash
# Press Ctrl+C to stop current server
npm run dev
```

### Step 3: Test (5 min)
1. Open http://localhost:3001
2. Scroll down → Should see braiders in "Featured Braiders" section
3. Login as admin → Should see admin dashboard (not customer page)
4. Go to /admin/users → Should see all users with phone numbers

## Done! ✅

If braiders still don't show:
1. Check browser console (F12) for error logs
2. Check Network tab for `/api/braiders` response
3. Restart dev server again

---

**Time**: 10 minutes
**Difficulty**: Easy
**Result**: All three issues fixed
