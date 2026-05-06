# 📋 COPY-PASTE SQL SCRIPT

## 🎯 What to Do

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. **Copy everything below** (from "-- ====" to the end)
5. Paste into SQL Editor
6. Click "Run"
7. Wait for completion

---

## 📋 SQL Script to Copy

```sql
-- ============================================================================
-- FIX BRAIDERS AND BOOKINGS - POPULATE MISSING DATA
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE ALL BRAIDERS HAVE COMPLETE PROFILES
-- ============================================================================

INSERT INTO public.braider_profiles (user_id, full_name, email, bio, verification_status, created_at, updated_at)
SELECT 
  p.id,
  p.full_name,
  p.email,
  'Professional braider' as bio,
  'unverified' as verification_status,
  NOW(),
  NOW()
FROM public.profiles p
WHERE p.role = 'braider'
AND NOT EXISTS (
  SELECT 1 FROM public.braider_profiles bp WHERE bp.user_id = p.id
)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: CREATE SAMPLE SERVICES FOR BRAIDERS
-- ============================================================================

INSERT INTO public.services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT 
  bp.user_id,
  'Box Braids' as name,
  'Professional box braids' as description,
  'box_braids' as category,
  120 as duration_minutes,
  80.00 as price,
  true as is_active,
  NOW(),
  NOW()
FROM public.braider_profiles bp
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s WHERE s.braider_id = bp.user_id AND s.name = 'Box Braids'
);

INSERT INTO public.services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT 
  bp.user_id,
  'Knotless Braids' as name,
  'Knotless braiding service' as description,
  'knotless' as category,
  150 as duration_minutes,
  100.00 as price,
  true as is_active,
  NOW(),
  NOW()
FROM public.braider_profiles bp
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s WHERE s.braider_id = bp.user_id AND s.name = 'Knotless Braids'
);

INSERT INTO public.services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT 
  bp.user_id,
  'Cornrows' as name,
  'Beautiful cornrow styles' as description,
  'cornrows' as category,
  90 as duration_minutes,
  60.00 as price,
  true as is_active,
  NOW(),
  NOW()
FROM public.braider_profiles bp
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s WHERE s.braider_id = bp.user_id AND s.name = 'Cornrows'
);

-- ============================================================================
-- STEP 3: VERIFY RESULTS
-- ============================================================================

SELECT 
  'Braider Profiles' as table_name,
  COUNT(*) as total_records
FROM public.braider_profiles

UNION ALL

SELECT 
  'Services' as table_name,
  COUNT(*) as total_records
FROM public.services;

-- Show braiders with services
SELECT 
  bp.id,
  bp.user_id,
  bp.full_name,
  bp.email,
  COUNT(s.id) as service_count
FROM public.braider_profiles bp
LEFT JOIN public.services s ON s.braider_id = bp.user_id
GROUP BY bp.id, bp.user_id, bp.full_name, bp.email
ORDER BY bp.created_at DESC;

-- Show all services
SELECT 
  s.id,
  s.braider_id,
  s.name,
  s.category,
  s.price,
  s.duration_minutes
FROM public.services s
ORDER BY s.created_at DESC;
```

---

## ✅ Expected Output

After running the script, you should see:

### Result 1: Table Counts
```
table_name          | total_records
--------------------|---------------
Braider Profiles    | X
Services            | 3X (3 services per braider)
```

### Result 2: Braiders with Services
```
id  | user_id | full_name | email | service_count
----|---------|-----------|-------|---------------
1   | uuid1   | Sarah J.  | ...   | 3
2   | uuid2   | Amara W.  | ...   | 3
3   | uuid3   | Bella M.  | ...   | 3
...
```

### Result 3: All Services
```
id  | braider_id | name              | category      | price | duration_minutes
----|------------|-------------------|---------------|-------|------------------
1   | uuid1      | Box Braids        | box_braids    | 80.00 | 120
2   | uuid1      | Knotless Braids   | knotless      | 100.00| 150
3   | uuid1      | Cornrows          | cornrows      | 60.00 | 90
4   | uuid2      | Box Braids        | box_braids    | 80.00 | 120
...
```

---

## 🚀 Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to https://app.supabase.com
- Select your project

### 2. Go to SQL Editor
- Click "SQL Editor" in left sidebar
- Click "New Query" button

### 3. Copy SQL Script
- Select all text above (from "-- ====" to the end)
- Copy to clipboard (Ctrl+C or Cmd+C)

### 4. Paste into Editor
- Click in the SQL editor area
- Paste (Ctrl+V or Cmd+V)

### 5. Run Query
- Click "Run" button (or Ctrl+Enter)
- Wait for completion

### 6. Check Results
- Should see 3 result sets
- No errors
- Braider profiles created
- Services created

---

## ⏱️ Time

- Copy SQL: 1 minute
- Paste into editor: 1 minute
- Run query: 1-2 minutes
- **Total: 3-4 minutes**

---

## ✅ Verification

After running SQL:

1. **Check Braider Profiles**
   - Should see X braiders
   - Each with full_name and email

2. **Check Services**
   - Should see 3X services (3 per braider)
   - Box Braids, Knotless, Cornrows

3. **Check Braiders with Services**
   - Each braider should have 3 services

---

## 🎯 Next Steps After SQL

1. **Test in App**
   - Homepage should show braiders
   - Search should find braiders
   - Booking should show services

2. **Commit Changes**
   ```bash
   git add -A
   git commit -m "Populate braider profiles and services"
   git push origin master
   ```

3. **Deploy**
   - Vercel auto-deploys on push

---

## 📞 If It Fails

### Error: "relation does not exist"
- Check table names are correct
- Verify tables exist in Supabase

### Error: "duplicate key value"
- Script handles this with ON CONFLICT
- Safe to run multiple times

### No results
- Check if braiders exist in profiles table
- Verify role='braider' for some users

---

## 💡 What This Script Does

### Step 1: Create Braider Profiles
- For each user with role='braider'
- Creates entry in braider_profiles table
- Adds full_name, email, bio

### Step 2: Create Services
- For each braider profile
- Creates 3 services:
  - Box Braids: $80 (2 hours)
  - Knotless Braids: $100 (2.5 hours)
  - Cornrows: $60 (1.5 hours)

### Step 3: Verify
- Shows total braiders
- Shows total services
- Shows braiders with service counts
- Shows all services

---

## ✨ That's It!

Copy, paste, run. Done!

