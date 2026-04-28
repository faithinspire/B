# DATABASE MIGRATION INSTRUCTIONS

**Status**: Ready to Execute  
**File**: `supabase/migrations/fix_critical_issues.sql`  
**Estimated Time**: 2-3 minutes

---

## STEP-BY-STEP GUIDE

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Log in with your credentials
3. Select your project (BraidMe)

### Step 2: Navigate to SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New Query** button (top right)

### Step 3: Copy Migration SQL
1. Open file: `supabase/migrations/fix_critical_issues.sql`
2. Select all content (Ctrl+A)
3. Copy (Ctrl+C)

### Step 4: Paste into SQL Editor
1. Click in the SQL Editor text area
2. Paste the SQL (Ctrl+V)
3. You should see the entire migration script

### Step 5: Execute Migration
1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for the query to complete
3. You should see "Success" message

### Step 6: Verify Migration
After successful execution, verify the changes:

**Check Conversations Table**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;
```

**Check Messages Table**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;
```

**Check Marketplace Products**:
```sql
SELECT COUNT(*) as product_count FROM marketplace_products;
```

**Check Braider Status Table**:
```sql
SELECT COUNT(*) as status_count FROM braider_status;
```

---

## WHAT THE MIGRATION DOES

### 1. Conversations Table
Adds 5 new columns:
- `customer_id` (UUID) - Links to customer
- `braider_id` (UUID) - Links to braider
- `booking_id` (TEXT) - Links to booking
- `admin_id` (UUID) - Links to admin (if admin joins)
- `status` (TEXT) - Conversation status (active, archived, etc.)

Creates 4 indexes for performance.

### 2. Messages Table
Adds 2 new columns:
- `read` (BOOLEAN) - Whether message has been read
- `sender_role` (TEXT) - Role of sender (customer, braider, admin)

Creates 4 indexes for performance.

### 3. Marketplace Products Table
Adds 6 new columns:
- `country_code` (TEXT) - Country code (NG, US, etc.)
- `location_state` (TEXT) - State/Province
- `location_city` (TEXT) - City
- `category` (TEXT) - Product category
- `rating_avg` (DECIMAL) - Average rating
- `rating_count` (INTEGER) - Number of ratings

Creates 5 indexes for performance.

### 4. Braider Status Table (NEW)
Creates new table with 7 columns:
- `id` (UUID) - Primary key
- `braider_id` (UUID) - Links to braider
- `media_url` (TEXT) - URL to image/video
- `media_type` (TEXT) - 'image' or 'video'
- `caption` (TEXT) - Status caption
- `created_at` (TIMESTAMP) - Creation time
- `expires_at` (TIMESTAMP) - Expiration time
- `view_count` (INTEGER) - Number of views

Creates 2 indexes for performance.

### 5. Status Views Table (NEW)
Creates new table with 4 columns:
- `id` (UUID) - Primary key
- `status_id` (UUID) - Links to status
- `viewer_id` (UUID) - Links to viewer
- `viewed_at` (TIMESTAMP) - View time

Creates 2 indexes for performance.

### 6. Bookings Table
Adds 2 new columns:
- `braider_country` (TEXT) - Country of braider (NG, US, etc.)
- `currency` (TEXT) - Currency (NGN, USD, etc.)

Creates 2 indexes for performance.

---

## TROUBLESHOOTING

### Issue: "Column already exists"
**Solution**: This is normal if the migration was partially run before. The `IF NOT EXISTS` clause prevents errors.

### Issue: "Permission denied"
**Solution**: Make sure you're using a role with sufficient permissions. Use the service role key if needed.

### Issue: "Table does not exist"
**Solution**: This shouldn't happen, but if it does, check that the table names are correct in your database.

### Issue: Migration takes too long
**Solution**: This is normal for large tables. Wait for it to complete. Don't refresh the page.

---

## VERIFICATION AFTER MIGRATION

### 1. Check Conversations Table
```sql
SELECT * FROM conversations LIMIT 1;
```
Should show all columns including: customer_id, braider_id, booking_id, admin_id, status

### 2. Check Messages Table
```sql
SELECT * FROM messages LIMIT 1;
```
Should show all columns including: read, sender_role

### 3. Check Marketplace Products
```sql
SELECT * FROM marketplace_products LIMIT 1;
```
Should show all columns including: country_code, location_state, location_city, category, rating_avg, rating_count

### 4. Check Braider Status Table
```sql
SELECT * FROM braider_status LIMIT 1;
```
Should show all columns: id, braider_id, media_url, media_type, caption, created_at, expires_at, view_count

### 5. Check Status Views Table
```sql
SELECT * FROM status_views LIMIT 1;
```
Should show all columns: id, status_id, viewer_id, viewed_at

### 6. Check Bookings Table
```sql
SELECT * FROM bookings LIMIT 1;
```
Should show all columns including: braider_country, currency

---

## NEXT STEPS AFTER MIGRATION

1. **Test Password Reset**
   - Go to login page
   - Click "Forgot Password"
   - Enter email
   - Check email for reset link
   - Click link and reset password

2. **Test Payment Provider Selection**
   - Create booking with USA braider
   - Go to payment page
   - Should show Stripe (not Paystack)

3. **Test Chat**
   - Create booking
   - Go to chat page
   - Send message
   - Verify message appears on other side

4. **Test Marketplace**
   - Go to marketplace page
   - Should show products (not "Empty")

5. **Test Braider Status**
   - Go to braider dashboard
   - Create status
   - Go to braider profile
   - Verify status displays

---

## ROLLBACK (if needed)

If something goes wrong, you can manually delete the added columns:

```sql
-- Remove columns from conversations
ALTER TABLE conversations DROP COLUMN IF EXISTS customer_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS braider_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS booking_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS admin_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS status;

-- Remove columns from messages
ALTER TABLE messages DROP COLUMN IF EXISTS read;
ALTER TABLE messages DROP COLUMN IF EXISTS sender_role;

-- Remove columns from marketplace_products
ALTER TABLE marketplace_products DROP COLUMN IF EXISTS country_code;
ALTER TABLE marketplace_products DROP COLUMN IF EXISTS location_state;
ALTER TABLE marketplace_products DROP COLUMN IF EXISTS location_city;
ALTER TABLE marketplace_products DROP COLUMN IF EXISTS category;
ALTER TABLE marketplace_products DROP COLUMN IF EXISTS rating_avg;
ALTER TABLE marketplace_products DROP COLUMN IF EXISTS rating_count;

-- Remove columns from bookings
ALTER TABLE bookings DROP COLUMN IF EXISTS braider_country;
ALTER TABLE bookings DROP COLUMN IF EXISTS currency;

-- Drop new tables
DROP TABLE IF EXISTS status_views;
DROP TABLE IF EXISTS braider_status;
```

---

## SUPPORT

If you encounter any issues:
1. Check the error message in Supabase SQL Editor
2. Verify the SQL syntax is correct
3. Check that all required tables exist
4. Try running the migration again
5. Contact support if issues persist

---

## SUMMARY

✅ Open Supabase Dashboard  
✅ Go to SQL Editor  
✅ Create new query  
✅ Copy migration SQL  
✅ Paste into editor  
✅ Click Run  
✅ Wait for completion  
✅ Verify changes  
✅ Test features  

**Estimated Time**: 2-3 minutes
