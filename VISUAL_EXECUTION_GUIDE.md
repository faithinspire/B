# VISUAL EXECUTION GUIDE

## Step-by-Step with Screenshots

---

## STEP 1: Open Supabase SQL Editor

### Action:
1. Go to: https://app.supabase.com/project/gymgxcspjysrkluxyavd/sql/new
2. You should see a blank SQL editor

### What You'll See:
```
┌─────────────────────────────────────────────────────────────┐
│  Supabase SQL Editor                                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [New Query]  [Saved Queries]  [Documentation]              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ -- Write your SQL here                                  │ │
│  │                                                          │ │
│  │                                                          │ │
│  │                                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Run] [Format] [Save]                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## STEP 2: Paste SQL Migration 1

### Action:
1. Click in the SQL editor
2. Copy the entire SQL block below
3. Paste it into the editor

### SQL to Paste:
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

### What You'll See:
```
┌─────────────────────────────────────────────────────────────┐
│  Supabase SQL Editor                                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ -- Add missing columns to braider_profiles table        │ │
│  │ ALTER TABLE braider_profiles                            │ │
│  │   ADD COLUMN IF NOT EXISTS is_premium BOOLEAN ...       │ │
│  │   ...                                                    │ │
│  │ SELECT 'Migration completed successfully!' AS status;   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Run] [Format] [Save]                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## STEP 3: Run SQL Migration 1

### Action:
1. Click the [Run] button (or press Ctrl+Enter)
2. Wait for the query to complete

### What You'll See (Success):
```
┌─────────────────────────────────────────────────────────────┐
│  Query Results                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ Query executed successfully                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ status                                                   │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Migration completed successfully!                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  1 row returned                                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## STEP 4: Paste SQL Migration 2

### Action:
1. Clear the editor (Ctrl+A, Delete)
2. Copy the SQL block below
3. Paste it into the editor

### SQL to Paste:
```sql
-- Fix Admin Role for damilola@gmail.com
UPDATE profiles 
SET role = 'admin', updated_at = NOW() 
WHERE email = 'damilola@gmail.com';

-- Verify the update
SELECT id, email, role, updated_at FROM profiles WHERE email = 'damilola@gmail.com';
```

---

## STEP 5: Run SQL Migration 2

### Action:
1. Click the [Run] button (or press Ctrl+Enter)
2. Wait for the query to complete

### What You'll See (Success):
```
┌─────────────────────────────────────────────────────────────┐
│  Query Results                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ Query executed successfully                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ id          │ email                │ role  │ updated_at │ │
│  ├─────────────┼──────────────────────┼───────┼────────────┤ │
│  │ user-id-123 │ damilola@gmail.com   │ admin │ 2024-...   │ │
│  └─────────────┴──────────────────────┴───────┴────────────┘ │
│                                                               │
│  1 row returned                                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## STEP 6: Restart Dev Server

### Action:
1. Open terminal
2. Press Ctrl+C to stop current server
3. Run: `npm run dev`

### What You'll See:
```
Terminal Output:
─────────────────────────────────────────────────────────────

$ npm run dev

> braiding-app@1.0.0 dev
> next dev -p 3001

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3001
  - Environments: .env.local

✓ Ready in 2.5s
✓ Compiled client and server successfully

```

---

## STEP 7: Test Homepage Featured Braiders

### Action:
1. Open: http://localhost:3001
2. Scroll down to "Featured Braiders" section

### What You'll See (Success):
```
┌─────────────────────────────────────────────────────────────┐
│  BraidMe Homepage                                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Hero Section]                                              │
│                                                               │
│  Featured Braiders                                           │
│  Top-rated professionals ready to serve you                 │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ [Image]  │  │ [Image]  │  │ [Image]  │  │ [Image]  │    │
│  │ Name     │  │ Name     │  │ Name     │  │ Name     │    │
│  │ Bio...   │  │ Bio...   │  │ Bio...   │  │ Bio...   │    │
│  │ ⭐ 4.8   │  │ ⭐ 4.9   │  │ ⭐ 5.0   │  │ ⭐ 4.7   │    │
│  │ [View]   │  │ [View]   │  │ [View]   │  │ [View]   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ◀ [Carousel Dots] ▶                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

✅ **SUCCESS**: Braiders are displaying!

---

## STEP 8: Test Admin Dashboard

### Action:
1. Go to: http://localhost:3001/admin/dashboard
2. Login with: damilola@gmail.com
3. Enter your password

### What You'll See (Success):
```
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Dashboard                                                   │
│  Monitor platform activity                                  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Total Users  │  │ Conversations│  │ Bookings     │      │
│  │ 150          │  │ 45           │  │ 120          │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Revenue      │  │ Overview     │  │ Bookings     │      │
│  │ $5,234.50    │  │ Dashboard    │  │ Monitor      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  [Users] [Payments] [Disputes]                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

✅ **SUCCESS**: Admin dashboard is showing!

---

## STEP 9: Test Admin Users Page

### Action:
1. Go to: http://localhost:3001/admin/users
2. Look at the table

### What You'll See (Success):
```
┌─────────────────────────────────────────────────────────────┐
│  Users                                                       │
│  150 users                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Search] [All Roles ▼]                                     │
│                                                               │
│  ┌──────────┬──────────────┬────────┬──────────┬────────────┐
│  │ Name     │ Email        │ Role   │ Joined   │ Phone      │
│  ├──────────┼──────────────┼────────┼──────────┼────────────┤
│  │ John Doe │ john@ex.com  │ braider│ Jan 15  │ +1234567890│
│  │ Jane Sm. │ jane@ex.com  │ cust.  │ Jan 14  │ —          │
│  │ Admin U. │ admin@ex.com │ admin  │ Jan 13  │ +9876543210│
│  │ ...      │ ...          │ ...    │ ...     │ ...        │
│  └──────────┴──────────────┴────────┴──────────┴────────────┘
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

✅ **SUCCESS**: Phone numbers are displaying!

---

## ALL TESTS PASSED ✅

```
┌─────────────────────────────────────────────────────────────┐
│  FINAL STATUS                                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ SQL Migration 1: Completed                              │
│  ✅ SQL Migration 2: Completed                              │
│  ✅ Dev Server: Restarted                                   │
│  ✅ Homepage Featured Braiders: Displaying                  │
│  ✅ Admin Dashboard: Accessible                             │
│  ✅ Admin Users Page: Phone numbers showing                 │
│                                                               │
│  🎉 ALL THREE ISSUES FIXED!                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## NEXT STEPS

1. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Fix braiders display, admin role, and admin users phone field"
   git push origin master
   ```

2. **Deploy to Vercel**:
   - Vercel automatically deploys on git push
   - Check deployment at https://vercel.com

3. **Test in Production**:
   - Visit production URL
   - Test all three features
   - Monitor for errors

---

## DONE! 🚀

All three issues are now fixed!

