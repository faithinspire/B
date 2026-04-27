# Issues Explained & How to Verify Fixes

## Issue 1: Marketplace Products Not Showing ❌

### What's the Problem?
When you go to the homepage or `/marketplace` page, no products are displayed. The page shows "No products found" even though products should exist.

### Root Cause
The `marketplace_products` table in Supabase is either:
1. Empty (no products added yet)
2. Has products but they're marked as `is_active = false`
3. RLS policies are blocking the service role from accessing the data

### How to Verify
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
```sql
SELECT COUNT(*) as total_products,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM marketplace_products;
```
3. Check the results:
   - If `total_products = 0`: Database is empty
   - If `active_products = 0`: All products are inactive
   - If `active_products > 0`: Database has data, check RLS

### How to Fix
**Option A: If database is empty**
- Add test products to `marketplace_products` table
- Or ask braiders to add products through the app

**Option B: If RLS is blocking**
- Go to Supabase Dashboard → Authentication → Policies
- Check `marketplace_products` table policies
- Disable RLS if needed or update policies

**Option C: If products are inactive**
- Run this SQL:
```sql
UPDATE marketplace_products
SET is_active = true
WHERE is_active = false;
```

### How to Verify Fix
1. Go to homepage → Marketplace carousel
2. Should see product cards with images
3. Go to `/marketplace` page
4. Should see products in grid
5. Click on a product → Should show details

---

## Issue 2: Chat Input Covered by Bottom Navigation ❌

### What's the Problem?
When you open a chat message with a braider, the message input field at the bottom is hidden behind the bottom navigation bar. You can't see what you're typing.

### Root Cause
The chat container didn't have enough bottom padding, and the form wasn't positioned correctly relative to the navigation.

### How to Verify
1. Go to customer dashboard
2. Click on a braider → View profile
3. Click "Book" or go to messages
4. Open a chat conversation
5. Look at the message input field at the bottom
6. It should be ABOVE the bottom navigation, not covered by it

### How to Fix
**Already Fixed!** ✅
- Added `pb-40` (padding-bottom) to outer container
- Added `sticky bottom-0 z-50` to form element
- Set proper height: `calc(100vh - 250px)`

### How to Verify Fix
1. Open chat page
2. Message input should be visible above bottom nav
3. You should be able to type without obstruction
4. On mobile, input should still be visible
5. Try typing a long message - should wrap properly

---

## Issue 3: Barber Icons on Braiders ❌

### What's the Problem?
On the homepage "Featured Professionals" section and customer dashboard, braiders are showing a barber icon (💈) instead of a braider icon (✂️).

### Root Cause
The `braider_profiles` table has incorrect `profession_type` values. Some braiders have `profession_type = 'barber'` when they should have `profession_type = 'braider'`.

### How to Verify
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
```sql
SELECT COUNT(*) as braiders_with_wrong_type
FROM braider_profiles
WHERE profession_type = 'barber'
AND user_id IN (SELECT id FROM profiles WHERE role = 'braider');
```
3. If result > 0: There are braiders with wrong profession_type

### How to Fix
1. Go to Supabase Dashboard → SQL Editor
2. Run the script: `FIX_BRAIDER_PROFESSION_TYPE.sql`
3. This will:
   - Show how many braiders have wrong type
   - Update them to correct value
   - Verify the fix

### How to Verify Fix
1. Go to homepage → Featured Professionals section
2. All braiders should show ✂️ icon
3. Only barbers should show 💈 icon
4. Go to customer dashboard
5. Braiders section should show ✂️ icons
6. Barbers section should show 💈 icons
7. Clear browser cache (Ctrl+Shift+Delete) if still seeing old icons

---

## Issue 4: Payment API Key Issues ❌

### What's the Problem?
When trying to pay for a booking, you get an error: "invalid API key" or "Payment system not configured".

### Root Cause
The payment API keys are not configured in the environment variables:
1. Stripe keys are set but webhook secret is placeholder
2. Paystack keys are missing entirely

### How to Verify
1. Try to create a booking and pay
2. If you see "invalid API key" error: Keys are wrong or missing
3. Check `.env.local` file:
   - Should have `STRIPE_SECRET_KEY` starting with `sk_live_`
   - Should have `PAYSTACK_SECRET_KEY` starting with `ssk_live_`
   - Should have `STRIPE_WEBHOOK_SECRET` starting with `whsec_live_`

### How to Fix
**Step 1: Update Local Environment**
- File: `.env.local`
- Already done! ✅

**Step 2: Sync to Vercel (CRITICAL)**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update:
   ```
   PAYSTACK_SECRET_KEY=ssk_live_a8724725f7d1891a31b09bd1f3e5cfcee27a8265
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_b2499e1bf2df58c4654381fbf998e5d739512afe
   STRIPE_WEBHOOK_SECRET=whsec_live_your_actual_webhook_secret
   ```
3. Redeploy the application

### How to Verify Fix
1. Create a booking
2. Try to pay with Stripe (US users)
3. Should see Stripe payment form
4. Try to pay with Paystack (Nigeria users)
5. Should see Paystack payment form
6. Payment should process without "invalid API key" error

---

## Issue 5: Chat Modal Not Opening ❌

### What's the Problem?
When you click "Chat with Seller" button on a marketplace product, nothing happens. The chat modal doesn't open.

### Root Cause
Unknown - code looks correct. Possible causes:
1. User not authenticated
2. Conversation creation API failing
3. Navigation not working
4. JavaScript error in browser

### How to Verify
1. Go to marketplace page
2. Find a product
3. Click "Chat with Seller" button
4. Check if chat modal/page opens
5. If not, check browser console for errors (F12 → Console tab)

### How to Fix
**Step 1: Check Authentication**
- Make sure you're logged in as a customer
- If not logged in, you should be redirected to login

**Step 2: Check Browser Console**
- Press F12 to open developer tools
- Go to Console tab
- Look for any red error messages
- Screenshot the error and share it

**Step 3: Check Network Tab**
- Go to Network tab
- Click "Chat with Seller"
- Look for failed API calls
- Check `/api/conversations` endpoint

**Step 4: Test Manually**
- Go to `/messages` page directly
- Should show your conversations
- If this works, the issue is with the button click handler

### How to Verify Fix
1. Go to marketplace page
2. Click "Chat with Seller" on any product
3. Should navigate to chat page or open chat modal
4. Should see conversation with seller
5. Should be able to type and send messages

---

## Summary Table

| Issue | Status | Verification | Fix |
|-------|--------|--------------|-----|
| Marketplace products | 🔄 | Run SQL query | Check DB or RLS |
| Chat input covered | ✅ | Open chat page | Already fixed |
| Barber icons | 🔄 | Check homepage | Run SQL script |
| Payment API keys | 🔄 | Try to pay | Sync to Vercel |
| Chat modal | 🔄 | Click button | Check console |

---

## Quick Verification Steps

### 1. Marketplace Products
```
Homepage → Scroll down → Marketplace carousel
Should see: Product cards with images
If not: Run VERIFY_MARKETPLACE_DATABASE.sql
```

### 2. Chat Input
```
Dashboard → Click braider → Messages
Should see: Input field above bottom nav
If not: Already fixed, clear cache
```

### 3. Barber Icons
```
Homepage → Featured Professionals
Should see: ✂️ on braiders, 💈 on barbers
If not: Run FIX_BRAIDER_PROFESSION_TYPE.sql
```

### 4. Payment Keys
```
Dashboard → Book braider → Pay
Should see: Stripe or Paystack form
If not: Sync env vars to Vercel
```

### 5. Chat Modal
```
Marketplace → Click product → Chat with Seller
Should see: Chat page opens
If not: Check browser console (F12)
```

---

## Need Help?

1. **Check the logs**:
   - Supabase: Dashboard → Logs
   - Vercel: Dashboard → Deployments → Logs
   - Browser: F12 → Console tab

2. **Read the guides**:
   - `IMMEDIATE_ACTION_GUIDE_SESSION.md` - Step-by-step
   - `QUICK_ACTION_CARD_SESSION.md` - Quick reference

3. **Run the SQL scripts**:
   - `FIX_BRAIDER_PROFESSION_TYPE.sql` - Fix barber icons
   - `VERIFY_MARKETPLACE_DATABASE.sql` - Check marketplace

4. **Check the code**:
   - Paystack: `app/api/paystack/create-payment-intent/route.ts`
   - Marketplace: `app/(public)/marketplace/page.tsx`
   - Chat: `app/(customer)/messages/[booking_id]/page.tsx`

