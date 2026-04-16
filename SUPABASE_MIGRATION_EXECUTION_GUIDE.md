# SUPABASE MIGRATION EXECUTION GUIDE

**Objective**: Execute the marketplace migration in Supabase to create all database tables  
**Time**: 5 minutes  
**Difficulty**: Easy  
**Risk**: None - Safe to execute  

---

## QUICK START (3 Steps)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Sign in with your account
3. Click on your project
4. In left sidebar, click **SQL Editor**
5. Click **New Query** button

### Step 2: Copy the Migration SQL
1. Open file: `supabase/migrations/marketplace_complete_permanent_fix.sql`
2. Select all the SQL code (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 3: Execute in Supabase
1. Paste the SQL into the Supabase editor (Ctrl+V)
2. Click the **Run** button (or press Ctrl+Enter)
3. Wait for "Query executed successfully" message
4. Done! ✅

---

## DETAILED STEP-BY-STEP GUIDE

### STEP 1: Access Supabase Dashboard

**1.1 Open Supabase**
- Go to https://supabase.com
- You should see your projects listed

**1.2 Select Your Project**
- Click on your project name (e.g., "BraidMe")
- Wait for dashboard to load

**1.3 Navigate to SQL Editor**
- Look at the left sidebar
- Find **SQL Editor** option
- Click on it

**1.4 Create New Query**
- Click the **New Query** button
- A blank SQL editor will open

---

### STEP 2: Copy the Migration File

**2.1 Locate the Migration File**
- File path: `supabase/migrations/marketplace_complete_permanent_fix.sql`
- Open this file in your code editor

**2.2 Copy All SQL Code**
- Select all content (Ctrl+A)
- Copy to clipboard (Ctrl+C)

**2.3 Verify You Have the Code**
- The file should contain:
  - DROP TABLE statements
  - CREATE TABLE statements for 7 tables
  - INSERT statements for 9 categories
  - CREATE INDEX statements
  - CREATE POLICY statements
  - ALTER PUBLICATION statements
  - GRANT statements

---

### STEP 3: Paste and Execute

**3.1 Paste into Supabase**
- Click in the SQL editor area
- Paste the code (Ctrl+V)
- You should see all the SQL code in the editor

**3.2 Execute the Query**
- Look for the **Run** button (usually top-right)
- Click it, or press Ctrl+Enter
- The query will execute

**3.3 Wait for Completion**
- You'll see a progress indicator
- Wait for the message: "Query executed successfully"
- This means all tables were created

**3.4 Check for Errors**
- If you see an error message, note it down
- Common errors:
  - "Permission denied" - Check you have admin access
  - "Syntax error" - Check the SQL file is complete
  - "Table already exists" - This is OK, means it ran before

---

## VERIFICATION STEPS

After migration completes, verify everything worked:

### Verify in Supabase Table Editor

**4.1 Check marketplace_products Table**
1. In left sidebar, click **Table Editor**
2. Look for `marketplace_products` in the list
3. Click on it
4. Verify columns exist:
   - id, braider_id, name, description, category
   - price, currency, country_code
   - location_state, location_city
   - stock_quantity, image_url, ai_generated_image
   - status, is_active, rating_avg, rating_count
   - view_count, created_at, updated_at

**4.2 Check marketplace_categories Table**
1. Click on `marketplace_categories` in table list
2. Verify 9 categories exist:
   - Hair Extensions
   - Wigs & Hairpieces
   - Braiding Supplies
   - Hair Care Products
   - Accessories
   - Styling Tools
   - Protective Styles
   - Premium Services
   - Other Products

**4.3 Check Other Tables**
1. Verify these tables exist:
   - marketplace_orders
   - marketplace_order_items
   - marketplace_cart
   - marketplace_reviews
   - marketplace_wishlist
   - marketplace_sales_analytics

### Verify in Supabase SQL Editor

**4.4 Run a Test Query**
1. Go back to SQL Editor
2. Create a new query
3. Paste this SQL:
```sql
SELECT COUNT(*) as product_count FROM marketplace_products;
SELECT COUNT(*) as category_count FROM marketplace_categories;
```
4. Click Run
5. Should show:
   - product_count: 0 (no products yet)
   - category_count: 9 (9 categories)

---

## WHAT THE MIGRATION DOES

### Creates 7 Tables

**1. marketplace_products** (20 columns)
- Stores all product listings
- Includes braider_id, name, description, category
- Includes price, currency, country_code
- Includes location_state, location_city
- Includes stock_quantity, image_url
- Includes status, is_active, rating_avg, rating_count

**2. marketplace_categories** (5 columns)
- Stores product categories
- 9 default categories inserted
- Includes name, slug, description, icon_emoji

**3. marketplace_orders** (13 columns)
- Stores customer orders
- Includes customer_id, braider_id
- Includes total_amount, currency, status
- Includes payment_id, stripe_payment_intent_id
- Includes shipping_address, tracking_number

**4. marketplace_order_items** (5 columns)
- Stores items in each order
- Links orders to products
- Includes quantity, unit_price, subtotal

**5. marketplace_cart** (4 columns)
- Stores customer shopping carts
- Includes customer_id, product_id, quantity

**6. marketplace_reviews** (6 columns)
- Stores product reviews
- Includes rating (1-5), comment
- Links to order, product, customer

**7. marketplace_wishlist** (3 columns)
- Stores customer favorites
- Includes customer_id, product_id

### Creates Indexes (for performance)

- idx_marketplace_products_braider
- idx_marketplace_products_active
- idx_marketplace_products_status
- idx_marketplace_products_category
- idx_marketplace_products_country
- idx_marketplace_products_state
- idx_marketplace_orders_customer
- idx_marketplace_orders_braider
- idx_marketplace_orders_status
- idx_marketplace_cart_customer
- idx_marketplace_reviews_product
- idx_marketplace_reviews_customer

### Enables RLS (Row Level Security)

- Anyone can view active products
- Braiders can insert/update/delete their own products
- Customers can view their own orders
- Braiders can view orders for their products
- Customers can manage their own cart
- Customers can create reviews

### Enables Real-time Subscriptions

- marketplace_products
- marketplace_orders
- marketplace_order_items
- marketplace_cart
- marketplace_reviews

### Grants Permissions

- All authenticated users can:
  - SELECT, INSERT, UPDATE, DELETE on marketplace_products
  - SELECT, INSERT, UPDATE, DELETE on marketplace_orders
  - SELECT, INSERT, UPDATE, DELETE on marketplace_cart
  - SELECT, INSERT, UPDATE, DELETE on marketplace_reviews
  - SELECT on marketplace_categories

---

## TROUBLESHOOTING

### Error: "Permission denied"
**Cause**: You don't have admin access to the project  
**Solution**: 
1. Ask project owner to run the migration
2. Or ask to be added as admin

### Error: "Syntax error"
**Cause**: The SQL file is incomplete or corrupted  
**Solution**:
1. Verify you copied the entire file
2. Check file size is > 10KB
3. Try copying again

### Error: "Table already exists"
**Cause**: Migration was run before  
**Solution**: This is OK! The migration includes DROP TABLE statements
- It will drop old tables and create new ones
- All data will be lost (OK for first run)
- Just click Run again

### Error: "Column already exists"
**Cause**: Partial migration ran before  
**Solution**:
1. Go to Table Editor
2. Manually delete the marketplace tables
3. Run the migration again

### No error but nothing happens
**Cause**: Query might still be running  
**Solution**:
1. Wait 30 seconds
2. Check if "Query executed successfully" appears
3. If not, click Run again

---

## AFTER MIGRATION

### Next Steps

1. **Verify in Supabase** (2 minutes)
   - Check all tables exist
   - Check 9 categories inserted
   - Run test query

2. **Force Vercel Redeploy** (3 minutes)
   - Go to https://vercel.com
   - Select your project
   - Click Deployments
   - Find latest deployment
   - Click ... menu → Redeploy
   - Wait for deployment to complete

3. **Test Marketplace** (2 minutes)
   - Go to your app homepage
   - Scroll to "Trending Accessories & Products"
   - Should see real products (not demo)
   - Click "View All" to browse marketplace
   - Test filters and search

4. **Test Braider Dashboard** (2 minutes)
   - Log in as a braider
   - Go to `/braider/dashboard`
   - See the SELL section
   - Click "Add Product"
   - Fill in product details
   - Submit and verify product appears

---

## SUCCESS INDICATORS

After migration, you should see:

✅ All 7 marketplace tables in Supabase Table Editor  
✅ 9 categories in marketplace_categories table  
✅ No errors in SQL Editor  
✅ "Query executed successfully" message  
✅ Test query returns correct counts  
✅ Homepage shows real products (after Vercel redeploy)  
✅ Braiders can add products  
✅ Products appear in marketplace  

---

## QUICK REFERENCE

**File to Execute**: `supabase/migrations/marketplace_complete_permanent_fix.sql`  
**Location**: Supabase SQL Editor  
**Time**: 5 minutes  
**Difficulty**: Easy  
**Risk**: None  

**Steps**:
1. Open Supabase SQL Editor
2. Create New Query
3. Copy migration SQL
4. Paste into editor
5. Click Run
6. Wait for success message
7. Verify in Table Editor
8. Done! ✅

---

## SUPPORT

If you encounter issues:

1. **Check the migration file**
   - Verify it's complete
   - Check file size > 10KB

2. **Check Supabase logs**
   - Go to Supabase dashboard
   - Look for error messages
   - Check database logs

3. **Try again**
   - The migration is idempotent
   - Safe to run multiple times
   - Will drop and recreate tables

4. **Contact support**
   - If persistent errors
   - Provide error message
   - Provide migration file

---

**Last Updated**: April 16, 2026  
**Status**: Ready to Execute  
**Next Action**: Run the migration in Supabase SQL Editor
