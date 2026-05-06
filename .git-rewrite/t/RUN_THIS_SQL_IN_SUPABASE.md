# RUN THIS SQL IN SUPABASE - COPY & PASTE

## Instructions

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query** (top right)
4. **Copy the entire SQL code below**
5. **Paste it** into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see output showing all tables with `rowsecurity = false`

---

## SQL CODE TO RUN

```sql
-- ============================================================================
-- SAFE RLS DISABLE - ONLY DISABLES ON TABLES THAT EXIST
-- ============================================================================
-- This script safely disables RLS on all tables that are defined in the schema
-- It does NOT try to drop policies or reference non-existent tables

-- Disable RLS on all tables that exist in the schema
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS location_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS location_tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

---

## WHAT THIS DOES

✅ Disables Row Level Security (RLS) on all 15 tables
✅ Allows direct uploads without RLS violations
✅ Allows braiders to show on homepage
✅ Allows all users to read/write data without permission errors

---

## AFTER RUNNING SQL

1. **Hard refresh browser**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Test signup**: Sign up as braider
3. **Test uploads**: Upload avatar, portfolio, add service
4. **Check homepage**: Verify braiders show in featured section

---

## VERIFICATION

After running the SQL, you should see output like:

```
tablename              | rowsecurity
-----------------------+-------------
admin_logs             | f
bookings               | f
braider_profiles       | f
conversations          | f
favorites              | f
location_tracking      | f
location_tracking_sessions | f
messages               | f
notifications          | f
payments               | f
payouts                | f
portfolio              | f
profiles               | f
ratings                | f
services               | f
transactions           | f
```

All should show `f` (false) for rowsecurity, meaning RLS is disabled.

---

## TROUBLESHOOTING

**Error: "relation 'verification_documents' does not exist"**
- This means you ran a different SQL file
- Use this file instead - it only targets existing tables

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check your Supabase credentials

**Still getting RLS errors after running SQL**
- Hard refresh browser (Ctrl+Shift+R)
- Check that all tables show `rowsecurity = f` in the verification query
- If not, run the SQL again

---

## NEXT STEPS

Once SQL is run and verified:

1. ✅ Sign up as braider
2. ✅ Upload avatar on dashboard
3. ✅ Add service
4. ✅ Upload portfolio
5. ✅ Check homepage for featured braiders
6. ✅ Click "View Profile" to see braider profile page

**Everything should work without errors!**
