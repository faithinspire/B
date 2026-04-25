# CRITICAL FIXES - CURRENT SESSION

## Issues to Fix:

### 1. **Database Schema Error: buyer_id column doesn't exist**
   - The marketplace_orders table references `buyer_id` but it's not properly created
   - Need to run migration to create the table with all columns

### 2. **Braiders/Barbers Mixed on Homepage**
   - Customer dashboard shows both braiders and barbers mixed together
   - Need to separate them into distinct sections (already done in code, but need to verify)

### 3. **Marketplace Currency Issue (USA showing NAIRA)**
   - Products uploaded in USA marketplace showing NGN currency instead of USD
   - Need to fix currency logic based on country_code

### 4. **View Profile Not Working**
   - Clicking "View Profile" just refreshes instead of opening profile
   - Changed from router.push to `<a>` tag for proper navigation

### 5. **Messaging System Issues**
   - No chat modal/input space for customers to chat with sellers
   - Message route may not be working properly
   - Need to create proper messaging UI

### 6. **Payment Issues**
   - Stripe authentication failing for Nigeria bookings
   - Should use Paystack for Nigeria, Stripe for USA
   - Need to implement country-based payment gateway selection

### 7. **Order System**
   - No order confirmation flow
   - No dispatch tracking discussion between buyer and seller
   - Need to implement order status workflow

### 8. **Vercel Environment Variables**
   - Stripe keys need to be properly integrated from Vercel env vars

## Implementation Order:
1. Fix database schema (buyer_id column)
2. Fix marketplace currency display
3. Implement country-based payment gateway (Paystack for NG, Stripe for US)
4. Create messaging UI for marketplace
5. Implement order confirmation and tracking system
6. Fix profile navigation
7. Verify Vercel environment variables

