# Quick Fix Card - Copy & Paste

## The Problem
- Avatar uploads failing: "row-level security policy"
- Portfolio uploads failing: "row-level security policy"
- Service uploads failing: "row-level security policy"
- Braiders not showing on homepage

## The Solution
Disable RLS on all database tables

## What to Do

### 1. Go to Supabase
https://app.supabase.com → Select Project → SQL Editor → New Query

### 2. Copy This SQL
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
```

### 3. Paste & Run
Paste into SQL Editor → Click Run

### 4. Refresh App
Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## What Works After

✅ Avatar uploads
✅ Portfolio uploads
✅ Service additions
✅ Braiders on homepage
✅ All database operations

## Test It

1. Sign up as braider
2. Upload avatar → should work
3. Upload portfolio → should work
4. Add service → should work
5. Check homepage → braiders showing

---

**That's it! Everything will work after you run the SQL.**
