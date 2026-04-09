# QUICK REFERENCE - FINAL ACTIONS

## 3 Simple Steps (5 minutes)

---

## STEP 1: Run SQL Migration
**Go to**: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

**Copy & Paste**:
```sql
ALTER TABLE braider_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_braider_profiles_featured 
  ON braider_profiles(is_premium DESC, featured_order DESC, rating_avg DESC);

SELECT 'Migration completed successfully!' AS status;
```

**Click**: Run

---

## STEP 2: Fix Admin Role
**Go to**: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new

**Copy & Paste**:
```sql
UPDATE profiles 
SET role = 'admin', updated_at = NOW() 
WHERE email = 'damilola@gmail.com';

SELECT id, email, role, updated_at FROM profiles WHERE email = 'damilola@gmail.com';
```

**Click**: Run

---

## STEP 3: Restart Dev Server
**Terminal**:
```bash
# Ctrl+C to stop
npm run dev
```

---

## STEP 4: Test
- Homepage: http://localhost:3001 → Scroll to "Featured Braiders"
- Admin: http://localhost:3001/admin/dashboard → Login with damilola@gmail.com
- Users: http://localhost:3001/admin/users → Check phone column

---

## ✅ DONE!

All three issues fixed:
1. ✅ Braiders display on homepage
2. ✅ Admin dashboard shows correct page
3. ✅ Admin users page shows phone numbers

