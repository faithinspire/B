# Testing Guide - Current Session Fixes

## 🧪 Test Scenarios

### 1. Database Schema Test
**Objective**: Verify marketplace_orders table is created correctly

**Steps**:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run this query:
```sql
SELECT * FROM marketplace_orders LIMIT 1;
```
4. Should return empty result (no error)

**Expected Result**: ✅ Table exists with all columns

---

### 2. Currency Display Test
**Objective**: Verify correct currency symbols display

**Test Case A - Nigeria Product**:
1. Go to Marketplace
2. Filter by Country: Nigeria
3. Look at product prices
4. Should show: ₦ (Naira symbol)

**Test Case B - USA Product**:
1. Go to Marketplace
2. Filter by Country: USA
3. Look at product prices
4. Should show: $ (Dollar symbol)

**Expected Result**: ✅ Correct currency symbols for each country

---

### 3. Payment Gateway Selection Test
**Objective**: Verify correct payment gateway is used

**Test Case A - Nigeria Booking**:
1. Login as customer
2. Search for Nigerian braider
3. Click "Book"
4. Fill booking details
5. Click "Pay Now"
6. Should redirect to **Paystack** payment page
7. URL should contain `paystack.co`

**Test Case B - USA Booking**:
1. Login as customer
2. Search for USA braider
3. Click "Book"
4. Fill booking details
5. Click "Pay Now"
6. Should redirect to **Stripe** payment page
7. URL should contain `stripe.com`

**Expected Result**: ✅ Correct payment gateway for each country

---

### 4. Marketplace Order Creation Test
**Objective**: Verify orders are created correctly

**Steps**:
1. Go to Marketplace
2. Click "Order Now" on any product
3. Fill in delivery address
4. Click "Create Order"
5. Check Supabase: `SELECT * FROM marketplace_orders WHERE buyer_id = 'your_id'`

**Expected Result**: ✅ Order created with all fields populated

---

### 5. Marketplace Messaging Test
**Objective**: Verify buyer-seller messaging works

**Steps**:
1. Create a marketplace order (from Test 4)
2. Click "Chat with Seller" button
3. Type a message: "Hi, when can you dispatch?"
4. Click "Send"
5. Check Supabase: `SELECT * FROM marketplace_order_messages WHERE order_id = 'order_id'`

**Expected Result**: ✅ Message appears in database and UI

---

### 6. Order Status Update Test
**Objective**: Verify seller can update order status

**Steps**:
1. As seller, go to Orders page
2. Find an order
3. Click "Confirm Order"
4. Status should change to "confirmed"
5. Add tracking info
6. Status should change to "dispatched"

**Expected Result**: ✅ Order status updates correctly

---

### 7. Profile Navigation Test
**Objective**: Verify "View Profile" button works

**Steps**:
1. Go to Customer Dashboard
2. Find a braider/barber card
3. Click "View Profile" button
4. Should navigate to `/braider/[id]` page
5. Should NOT refresh the page

**Expected Result**: ✅ Profile page loads without refresh

---

### 8. Braiders/Barbers Separation Test
**Objective**: Verify braiders and barbers are separated

**Steps**:
1. Go to Customer Dashboard
2. Look for two sections:
   - "✂️ Braiders" section
   - "💈 Barbers" section
3. Verify each section shows correct professionals
4. Braiders should have braiding specialties
5. Barbers should have barber specialties

**Expected Result**: ✅ Clear separation between braiders and barbers

---

## 🔍 Verification Checklist

### Database
- [ ] `marketplace_orders` table exists
- [ ] `marketplace_order_messages` table exists
- [ ] Foreign keys are set correctly
- [ ] RLS policies are enabled
- [ ] Indexes are created

### Marketplace
- [ ] Nigeria products show ₦
- [ ] USA products show $
- [ ] Products can be ordered
- [ ] Orders appear in database

### Payments
- [ ] Nigeria bookings use Paystack
- [ ] USA bookings use Stripe
- [ ] Payment intents are created
- [ ] Payment status is tracked

### Messaging
- [ ] Messages can be sent
- [ ] Messages appear in database
- [ ] Only buyer/seller can see messages
- [ ] Messages are linked to orders

### Navigation
- [ ] View Profile works without refresh
- [ ] Braiders and barbers are separated
- [ ] Search filters work correctly
- [ ] Pagination works

---

## 🐛 Troubleshooting

### Issue: "buyer_id column doesn't exist"
**Solution**:
1. Run the migration: `supabase/migrations/add_marketplace_orders.sql`
2. Verify in Supabase SQL Editor
3. Refresh the page

### Issue: Wrong currency showing
**Solution**:
1. Check product's `country_code` field
2. Verify `getCurrencySymbol()` function in marketplace page
3. Clear browser cache
4. Refresh page

### Issue: Paystack not loading for Nigeria
**Solution**:
1. Check `PAYSTACK_SECRET_KEY` in Vercel
2. Verify braider has `braider_country = 'NG'`
3. Check browser console for errors
4. Check Vercel logs

### Issue: Messages not sending
**Solution**:
1. Verify order exists in database
2. Check sender_id matches buyer_id or seller_id
3. Check RLS policies are correct
4. Check browser console for errors

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Database Schema: ✅ / ❌
Currency Display: ✅ / ❌
Payment Gateway: ✅ / ❌
Order Creation: ✅ / ❌
Messaging: ✅ / ❌
Order Status: ✅ / ❌
Profile Navigation: ✅ / ❌
Braiders/Barbers: ✅ / ❌

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Environment variables set in Vercel
- [ ] Database migration executed
- [ ] No console errors
- [ ] Payment gateways tested
- [ ] Messaging tested
- [ ] Profile navigation tested
- [ ] Braiders/barbers separation verified

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Vercel logs
3. Check Supabase logs
4. Check browser console (F12)
5. Review the API route implementations

---

## ✅ Sign-Off

Once all tests pass, the system is ready for production deployment.

**Tested By**: ___________
**Date**: ___________
**Status**: ✅ Ready / ❌ Issues Found
