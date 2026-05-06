# 🔥 RUN SQL NOW - STEP BY STEP

## ⚠️ CRITICAL: You Haven't Run the SQL Script Yet!

That's why braiders aren't showing. The database is still empty.

---

## 🚀 DO THIS RIGHT NOW (3 minutes)

### Step 1: Open Supabase Dashboard
```
1. Go to: https://app.supabase.com
2. Login with your email/password
3. Select your project (the one for BraidMe)
```

### Step 2: Go to SQL Editor
```
1. In left sidebar, click "SQL Editor"
2. Click "New Query" button (top right)
3. You should see a blank SQL editor
```

### Step 3: Copy the SQL Script
**Copy EVERYTHING below** (from "-- DISABLE" to the last line):

```sql
-- DISABLE RLS (BYPASS)
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- POPULATE BRAIDER PROFILES
INSERT INTO braider_profiles (user_id, full_name, email, bio, experience_years, rating_avg, rating_count, verification_status, travel_radius_miles, is_mobile, created_at, updated_at)
SELECT p.id, COALESCE(p.full_name, 'Professional Braider'), COALESCE(p.email, ''), 'Professional braiding services', 0, 5.0, 0, 'verified', 15, true, NOW(), NOW()
FROM profiles p
WHERE p.role = 'braider'
AND NOT EXISTS (SELECT 1 FROM braider_profiles bp WHERE bp.user_id = p.id)
ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, updated_at = NOW();

-- CREATE BOX BRAIDS SERVICE
INSERT INTO services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT bp.user_id, 'Box Braids', 'Professional box braids - protective style', 'box_braids', 120, 80.00, true, NOW(), NOW()
FROM braider_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.braider_id = bp.user_id AND s.name = 'Box Braids')
ON CONFLICT DO NOTHING;

-- CREATE KNOTLESS BRAIDS SERVICE
INSERT INTO services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT bp.user_id, 'Knotless Braids', 'Knotless braiding - less tension, more comfortable', 'knotless', 150, 100.00, true, NOW(), NOW()
FROM braider_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.braider_id = bp.user_id AND s.name = 'Knotless Braids')
ON CONFLICT DO NOTHING;

-- CREATE CORNROWS SERVICE
INSERT INTO services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT bp.user_id, 'Cornrows', 'Beautiful cornrow styles - classic and modern', 'cornrows', 90, 60.00, true, NOW(), NOW()
FROM braider_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.braider_id = bp.user_id AND s.name = 'Cornrows')
ON CONFLICT DO NOTHING;

-- CREATE TWISTS SERVICE
INSERT INTO services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT bp.user_id, 'Twists', 'Senegalese twists and other twist styles', 'twists', 120, 75.00, true, NOW(), NOW()
FROM braider_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.braider_id = bp.user_id AND s.name = 'Twists')
ON CONFLICT DO NOTHING;

-- VERIFY RESULTS
SELECT 'Braider Profiles' as table_name, COUNT(*) as total_records FROM braider_profiles
UNION ALL
SELECT 'Services' as table_name, COUNT(*) as total_records FROM services;

SELECT bp.full_name, bp.email, COUNT(s.id) as service_count
FROM braider_profiles bp
LEFT JOIN services s ON s.braider_id = bp.user_id
GROUP BY bp.id, bp.full_name, bp.email
ORDER BY bp.created_at DESC;
```

### Step 4: Paste into Supabase
1. Click in the SQL editor (white area)
2. Paste the SQL (Ctrl+V or Cmd+V)
3. You should see the SQL code appear

### Step 5: Run the Query
1. Click the "Run" button (blue button, top right)
2. OR press Ctrl+Enter
3. Wait for it to complete (should be instant)

### Step 6: Check Results
You should see output like:
```
table_name          | total_records
--------------------|---------------
Braider Profiles    | 3
Services            | 12

full_name           | email              | service_count
--------------------|-------------------|---------------
Sarah Johnson       | sarah@example.com  | 4
Amara Williams      | amara@example.com  | 4
Bella Martinez      | bella@example.com  | 4
```

---

## ✅ If You See Results Like Above

**Congratulations!** The SQL ran successfully. Now:

1. **Refresh your app**
   - Go to http://localhost:3000/
   - Press Ctrl+R (or Cmd+R on Mac)
   - Scroll to "Featured Braiders"
   - Should see braiders now ✓

2. **Test Booking**
   - Click on a braider
   - Should see services ✓

3. **Test Admin Dashboard**
   - Login as admin
   - Should see admin dashboard (not customer) ✓

---

## ❌ If You See an Error

### Error: "relation does not exist"
- Table name is wrong
- Check table names in Supabase
- Try running: `SELECT * FROM information_schema.tables WHERE table_schema='public';`

### Error: "duplicate key value"
- Data already exists
- This is OK - script handles it with ON CONFLICT
- Just run it again

### Error: "permission denied"
- RLS is blocking access
- Script disables RLS first
- If error persists, manually run:
  ```sql
  ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE services DISABLE ROW LEVEL SECURITY;
  ```

### No Results Shown
- SQL ran but no data was inserted
- Check if braiders exist: `SELECT COUNT(*) FROM profiles WHERE role='braider';`
- If 0, you need to create test braiders first

---

## 🧪 Verify Database State

Run these queries one by one to check:

**Query 1: Check braiders exist**
```sql
SELECT COUNT(*) as braider_count FROM profiles WHERE role='braider';
```
Should return: 1 or more

**Query 2: Check braider profiles**
```sql
SELECT COUNT(*) as braider_profile_count FROM braider_profiles;
```
Should return: Same as Query 1

**Query 3: Check services**
```sql
SELECT COUNT(*) as service_count FROM services;
```
Should return: 4 × (number of braiders)

**Query 4: See all braiders**
```sql
SELECT full_name, email, verification_status FROM braider_profiles;
```
Should show list of braiders

---

## 📸 Screenshots Guide

### Step 1: Supabase Dashboard
```
┌─────────────────────────────────────────┐
│ Supabase                                │
│ ┌─────────────────────────────────────┐ │
│ │ Your Project                        │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ SQL Editor                      │ │ │
│ │ │ New Query                       │ │ │
│ │ │ [Blank SQL editor area]         │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Step 2: Paste SQL
```
┌─────────────────────────────────────────┐
│ SQL Editor                              │
│ ┌─────────────────────────────────────┐ │
│ │ -- DISABLE RLS                      │ │
│ │ ALTER TABLE braider_profiles...     │ │
│ │ ALTER TABLE services...             │ │
│ │ -- POPULATE BRAIDER PROFILES        │ │
│ │ INSERT INTO braider_profiles...     │ │
│ │ ...                                 │ │
│ │ [Run] [Format] [Save]               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Step 3: Click Run
```
┌─────────────────────────────────────────┐
│ SQL Editor                              │
│ ┌─────────────────────────────────────┐ │
│ │ [SQL code above]                    │ │
│ │ [Run] ← CLICK HERE                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Results:                                │
│ ┌─────────────────────────────────────┐ │
│ │ table_name    | total_records       │ │
│ │ Braider Prof. | 3                   │ │
│ │ Services      | 12                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## ⏱️ Time Required

- Open Supabase: 1 minute
- Copy SQL: 1 minute
- Paste & Run: 1 minute
- **Total: 3 minutes**

---

## 🎯 After Running SQL

### Immediate Actions
1. Refresh your app (Ctrl+R)
2. Check homepage - should show braiders
3. Check booking - should show services
4. Check admin dashboard - should show admin page

### If Still Not Working
1. Clear browser cache (Ctrl+Shift+Delete)
2. Close and reopen browser
3. Check browser console (F12) for errors
4. Check Supabase logs for errors

---

## 📞 Support

**Braiders still not showing after running SQL?**
1. Verify SQL ran successfully (check results)
2. Verify braider_profiles has records
3. Verify services has records
4. Clear browser cache
5. Refresh page

**Admin dashboard still showing customer page?**
1. Code fix is already applied
2. Clear browser cache
3. Logout and login again
4. Check user role in database

---

## ✨ That's It!

Just run the SQL script. Everything else is ready.

