# 🚨 CRITICAL FIXES - ACTION PLAN

## 5 CRITICAL ISSUES TO FIX

### ✅ ISSUE 1: USA BRAIDER USERS SHOWING PAYSTACK INSTEAD OF STRIPE
**Status**: FIXED
- Updated `app/api/bookings/route.ts` to include `braider_country` and `currency` fields
- Updated `app/(customer)/booking/[id]/page.tsx` to properly detect country and use correct payment provider
- Now defaults to Nigeria (NG) if country not specified, but respects USA (US) when set

**Files Modified**:
- `app/api/bookings/route.ts` - Added braider_country and currency to booking creation
- `app/(customer)/booking/[id]/page.tsx` - Fixed payment provider selection logic

---

### ✅ ISSUE 2: PASSWORD RESET EMAIL - USE SUPABASE
**Status**: FIXED
- Removed Resend dependency
- Updated `app/api/auth/forgot-password/route.ts` to use Supabase's native `resetPasswordForEmail()` method
- Kept token-based verification system for security
- Tokens are hashed and stored in database with 24-hour expiration

**Files Modified**:
- `app/api/auth/forgot-password/route.ts` - Now uses Supabase email service

---

### ⏳ ISSUE 3: CHAT NOT WORKING BETWEEN BUYER AND SELLER
**Status**: NEEDS DATABASE VERIFICATION
**Root Cause**: Database schema mismatch between conversations and messages tables

**What Needs to Be Done**:
1. Verify `conversations` table has these columns:
   - `id` (UUID)
   - `customer_id` (UUID)
   - `braider_id` (UUID)
   - `booking_id` (TEXT/UUID)
   - `admin_id` (UUID, nullable)
   - `status` (TEXT)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. Verify `messages` table has these columns:
   - `id` (UUID)
   - `conversation_id` (UUID)
   - `sender_id` (UUID)
   - `sender_role` (TEXT)
   - `content` (TEXT)
   - `read` (BOOLEAN) - OR `is_read` (BOOLEAN)
   - `created_at` (TIMESTAMP)

3. If schema is wrong, run the migration SQL below

**SQL Migration** (if needed):
```sql
-- Ensure conversations table has correct schema
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS braider_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Ensure messages table has correct schema
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'customer';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_braider_id ON conversations(braider_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
```

---

### ⏳ ISSUE 4: MARKETPLACE SHOWING "EMPTY" INSTEAD OF PRODUCTS
**Status**: NEEDS DATABASE VERIFICATION
**Root Cause**: marketplace_products table may be empty or products not being created

**What Needs to Be Done**:
1. Verify `marketplace_products` table exists and has data:
   ```sql
   SELECT COUNT(*) FROM marketplace_products;
   SELECT * FROM marketplace_products LIMIT 5;
   ```

2. If table is empty, check if products are being created:
   - Check braider dashboard for "Add Product" functionality
   - Verify product creation endpoint is working

3. If products exist but not showing, check:
   - `country_code` field is populated
   - `category` field is populated
   - No `is_active` filter is blocking products

4. Add demo products if needed:
   ```sql
   INSERT INTO marketplace_products (
     id, braider_id, name, description, price, currency, 
     category, country_code, location_state, location_city,
     image_url, rating_avg, rating_count, created_at
   ) VALUES
   ('prod_demo_1', 'braider_demo_1', 'Premium Hair Extensions', 'High quality 24-inch extensions', 5000, 'NGN', 'Extensions', 'NG', 'Lagos', 'Lagos', NULL, 4.5, 12, NOW()),
   ('prod_demo_2', 'braider_demo_2', 'Braiding Supplies Kit', 'Complete kit with threads and tools', 3500, 'NGN', 'Supplies', 'NG', 'Abuja', 'Abuja', NULL, 4.8, 8, NOW());
   ```

---

### ⏳ ISSUE 5: STATUS NOT SHOWING ON BRAIDER/BARBER PAGES
**Status**: NEEDS DATABASE VERIFICATION
**Root Cause**: braider_status table may be empty or feature not being used

**What Needs to Be Done**:
1. Verify `braider_status` table exists:
   ```sql
   SELECT COUNT(*) FROM braider_status;
   SELECT * FROM braider_status LIMIT 5;
   ```

2. Verify `status_views` table exists:
   ```sql
   SELECT COUNT(*) FROM status_views;
   ```

3. If tables don't exist, create them:
   ```sql
   CREATE TABLE IF NOT EXISTS braider_status (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     media_url TEXT NOT NULL,
     media_type TEXT CHECK (media_type IN ('image', 'video')),
     caption TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     expires_at TIMESTAMP NOT NULL,
     view_count INTEGER DEFAULT 0
   );

   CREATE TABLE IF NOT EXISTS status_views (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     status_id UUID NOT NULL REFERENCES braider_status(id) ON DELETE CASCADE,
     viewer_id UUID NOT NULL,
     viewed_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_braider_status_braider_id ON braider_status(braider_id);
   CREATE INDEX idx_braider_status_expires_at ON braider_status(expires_at);
   CREATE INDEX idx_status_views_status_id ON status_views(status_id);
   ```

4. Add "Create Status" button to braider dashboard
5. Show placeholder when no statuses exist

---

## IMPLEMENTATION CHECKLIST

### Code Changes (DONE ✅)
- [x] Fix payment provider selection for USA braiders
- [x] Switch password reset to use Supabase
- [ ] Verify chat system database schema
- [ ] Verify marketplace database schema
- [ ] Verify status feature database schema

### Database Verification (TODO)
- [ ] Check conversations table schema
- [ ] Check messages table schema
- [ ] Check marketplace_products table has data
- [ ] Check braider_status table exists
- [ ] Check status_views table exists

### Testing (TODO)
- [ ] Test USA braider booking with Stripe
- [ ] Test Nigerian braider booking with Paystack
- [ ] Test password reset email via Supabase
- [ ] Test chat between customer and braider
- [ ] Test marketplace product display
- [ ] Test braider status creation and display

---

## NEXT STEPS

1. **Verify Database Schema** - Run the SQL queries above to check table schemas
2. **Run Migrations** - If tables are missing or schema is wrong, run the SQL migrations
3. **Test Each Feature** - Test all 5 features end-to-end
4. **Deploy** - Commit changes and deploy to production

---

## ESTIMATED TIME

- Code changes: ✅ DONE (25 minutes)
- Database verification: 10 minutes
- Database migrations: 5 minutes
- Testing: 20 minutes
- Deployment: 5 minutes

**Total: ~65 minutes**

---

## FILES MODIFIED

1. `app/api/auth/forgot-password/route.ts` - ✅ DONE
2. `app/api/bookings/route.ts` - ✅ DONE
3. `app/(customer)/booking/[id]/page.tsx` - ✅ DONE

---

## STATUS

✅ Code changes complete
⏳ Waiting for database verification and testing
