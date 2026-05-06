# How to Disable RLS in Supabase - Step by Step

## Option 1: Using Supabase Dashboard (Easiest)

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)

### Step 2: Run the Disable RLS Script
1. Click **New Query**
2. Copy and paste the entire content from `DISABLE_ALL_RLS_NOW.sql`
3. Click **Run** (or press Ctrl+Enter)
4. Wait for the query to complete

### Step 3: Verify RLS is Disabled
The query will show a table with all tables and their RLS status. All should show `f` (false) for rowsecurity.

---

## Option 2: Using SQL Editor in Supabase

1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL:

```sql
-- Disable RLS on all tables
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

-- Verify all RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

5. Click **Run**

---

## What This Does

- **Disables Row Level Security (RLS)** on all tables
- Allows **all users** to read/write/update/delete data
- **Removes all security restrictions** on database operations
- Fixes "new row violates row-level security policy" errors
- Allows uploads to work without RLS violations

---

## After Disabling RLS

1. **Avatar uploads** will work without errors
2. **Portfolio uploads** will work without errors
3. **Service additions** will work without errors
4. **Braiders will show** on the homepage
5. **All database operations** will work freely

---

## Testing

After disabling RLS:

1. Sign up as a braider
2. Upload an avatar - should work
3. Upload portfolio images - should work
4. Add services - should work
5. Go to homepage - should see registered braiders

---

## Important Notes

⚠️ **This disables ALL security on the database**
- Only use this for development/testing
- For production, implement proper RLS policies
- This allows anyone to access/modify any data

---

## If You Need to Re-enable RLS Later

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

---

## Troubleshooting

**Q: I see "table does not exist" error**
A: Some tables might not exist yet. That's OK - the script will skip them.

**Q: Uploads still failing after disabling RLS**
A: 
1. Refresh the page
2. Clear browser cache
3. Try uploading again
4. Check browser console for errors

**Q: Braiders still not showing on homepage**
A: 
1. Make sure you signed up as a braider
2. Check that braider_profiles table has data
3. Refresh the page
4. Check browser console for errors

---

## Quick Command

If you want to disable RLS on just the critical tables:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
```
