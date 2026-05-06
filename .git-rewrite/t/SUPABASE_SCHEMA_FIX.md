# Supabase Schema Fix Required

## Missing Columns
The profiles table is missing these columns:
- `ip_address` - User's IP address
- `location` - User's location
- `last_ip_update` - When IP was last updated

## Solution
Add these columns to your profiles table in Supabase.

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run this SQL:

```sql
ALTER TABLE profiles
ADD COLUMN ip_address TEXT,
ADD COLUMN location TEXT,
ADD COLUMN last_ip_update TIMESTAMP;
```

### Option 2: Using SQL Editor
1. Go to your Supabase project
2. Click "SQL Editor"
3. Create new query
4. Paste the SQL above
5. Click "Run"

## After Adding Columns
- Signup will work
- Login will work
- IP tracking will work
- Admin dashboard will show IPs

## Verify
After running SQL, try signing up again. It should work!
