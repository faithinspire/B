# 🚀 IMMEDIATE EXECUTION CHECKLIST - PHASE 1 COMPLETE

## DO THIS NOW (In Order)

### Step 1: Run Database Migration
**Time**: 5 minutes

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of: `supabase/migrations/PHASE_1_ROOT_CAUSE_ELIMINATION.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify: No errors, all tables created/modified

**What it does**:
- Adds missing columns to all tables
- Creates payment and verification tables
- Adds triggers for data consistency
- Disables RLS temporarily
- Logs data inconsistencies

---

### Step 2: Deploy Code Changes
**Time**: 2 minutes

All code changes are already in place:
- ✅ `app/api/auth/login/route.ts` - Role verification enhanced
- ✅ `app/api/conversations/route.ts` - Schema mismatch fixed
- ✅ `app/api/bookings/route.ts` - Country defaults fixed
- ✅ `app/api/braiders/route.ts` - Verification filter fixed
- ✅ `app/api/marketplace/products/route.ts` - is_active filter added
- ✅ `app/api/stripe/create-payment-intent/route.ts` - Currency fixed
- ✅ `app/api/payments/resolve-provider/route.ts` - NEW: Central payment controller
- ✅ `app/api/payments/auto-release-escrow/route.ts` - NEW: Escrow auto-release

**Deploy**:
```bash
git add .
git commit -m "PHASE 1: Root-cause elimination - fix all critical failures"
git push origin main
```

---

### Step 3: Test Signup Flow
**Time**: 5 minutes

**Test 1: Customer Signup**
1. Go to `/signup/customer`
2. Fill form: email, password, name, country (US)
3. Submit
4. Verify: Redirected to login
5. Check database:
   - profiles table: role='customer', country='US'
   - No braider_profiles record

**Test 2: Braider Signup**
1. Go to `/signup/braider`
2. Fill form: email, password, name, country (NG), specialization
3. Submit
4. Verify: Redirected to login
5. Check database:
   - profiles table: role='braider', country='NG'
   - braider_profiles table: user_id matches, country='NG'
   - braider_verification table: status='pending'

**Expected Result**: ✅ Both signup flows work, data consistent

---

### Step 4: Test Login Flow
**Time**: 5 minutes

**Test 1: Customer Login**
1. Go to `/login`
2. Enter customer email/password
3. Submit
4. Verify: Redirected to `/dashboard` (customer dashboard)
5. Check: User object has role='customer'

**Test 2: Braider Login**
1. Go to `/login`
2. Enter braider email/password
3. Submit
4. Verify: Redirected to `/braider/dashboard` (braider dashboard)
5. Check: User object has role='braider'

**Expected Result**: ✅ Both login flows work, correct role assigned

---

### Step 5: Test Braider Visibility
**Time**: 5 minutes

**Test 1: Unverified Braider Hidden**
1. Create braider account (verification_status='pending')
2. Go to `/search` or `/` (homepage)
3. Verify: Braider NOT in search results
4. Check API: `/api/braiders` returns empty or doesn't include this braider

**Test 2: Verified Braider Visible**
1. Go to Supabase → braider_profiles table
2. Find the braider created in Test 1
3. Update: verification_status='verified'
4. Go to `/search` or `/` (homepage)
5. Verify: Braider NOW appears in search results

**Expected Result**: ✅ Only verified braiders visible

---

### Step 6: Test Booking Flow
**Time**: 10 minutes

**Test 1: Create Booking for US Braider**
1. Search for verified US braider
2. Click "Book"
3. Fill booking form
4. Submit
5. Check database:
   - bookings table: braider_country='US', currency='USD'
   - Verify: NOT 'NG' or 'NGN'

**Test 2: Create Booking for NG Braider**
1. Search for verified NG braider
2. Click "Book"
3. Fill booking form
4. Submit
5. Check database:
   - bookings table: braider_country='NG', currency='NGN'
   - Verify: NOT 'US' or 'USD'

**Expected Result**: ✅ Bookings have correct country and currency

---

### Step 7: Test Payment Flow
**Time**: 10 minutes

**Test 1: Payment Intent for US Braider**
1. Create booking for US braider
2. Click "Pay"
3. Check API response:
   - currency='usd'
   - amount in cents (e.g., 5000 for $50)
4. Verify: Stripe payment intent created

**Test 2: Payment Intent for NG Braider**
1. Create booking for NG braider
2. Click "Pay"
3. Check API response:
   - currency='ngn'
   - amount in kobo (e.g., 500000 for ₦5000)
4. Verify: Paystack payment intent created (or Stripe with NGN)

**Expected Result**: ✅ Correct currency and amount for each braider

---

### Step 8: Test Chat Flow
**Time**: 10 minutes

**Test 1: Create Conversation**
1. Create booking (customer + braider)
2. Go to `/messages`
3. Verify: Conversation appears
4. Check database:
   - conversations table: customer_id, braider_id, booking_id populated

**Test 2: Send Message**
1. Click on conversation
2. Type message
3. Click send
4. Verify: Message appears in chat
5. Check database:
   - messages table: conversation_id, sender_id, content populated

**Test 3: Real-Time Sync**
1. Open chat in two browser windows (customer + braider)
2. Send message from customer
3. Verify: Message appears in braider's window in real-time

**Expected Result**: ✅ Chat works, messages sync in real-time

---

### Step 9: Test Marketplace
**Time**: 5 minutes

**Test 1: Upload Product**
1. Go to braider dashboard
2. Upload portfolio item
3. Verify: Product appears in marketplace
4. Check database:
   - marketplace_products table: is_active=true

**Test 2: Deactivate Product**
1. Go to braider dashboard
2. Mark product as inactive
3. Go to marketplace
4. Verify: Product NO LONGER appears
5. Check database:
   - marketplace_products table: is_active=false

**Expected Result**: ✅ Only active products visible in marketplace

---

### Step 10: Test Escrow Release
**Time**: 5 minutes

**Test 1: Manual Escrow Release**
1. Create booking and complete it (status='completed')
2. Call `/api/payments/auto-release-escrow` manually
3. Check database:
   - bookings table: escrow_released=true, escrow_released_at populated
   - payments table: new payment record created
   - notifications table: braider notified

**Test 2: Auto-Release (48 hours)**
1. Create booking and complete it
2. Wait 48 hours (or manually update updated_at in database)
3. Call `/api/payments/auto-release-escrow`
4. Verify: Escrow released automatically

**Expected Result**: ✅ Escrow releases automatically after 48 hours

---

## VERIFICATION SUMMARY

After completing all 10 tests:

| Test | Status | Notes |
|------|--------|-------|
| Signup Flow | ✅ | Both customer and braider |
| Login Flow | ✅ | Correct role assignment |
| Braider Visibility | ✅ | Only verified braiders |
| Booking Flow | ✅ | Correct country/currency |
| Payment Flow | ✅ | Correct provider routing |
| Chat Flow | ✅ | Real-time messaging |
| Marketplace | ✅ | Only active products |
| Escrow Release | ✅ | Auto-release after 48h |

---

## TROUBLESHOOTING

### Issue: Braider not visible after signup
**Solution**:
1. Check braider_profiles table: Does record exist?
2. Check verification_status: Is it 'verified'?
3. If not verified, update to 'verified' in Supabase
4. Refresh search page

### Issue: Booking shows wrong country
**Solution**:
1. Check braider_profiles table: Does braider have country set?
2. If null, update to correct country
3. Create new booking
4. Verify correct country in bookings table

### Issue: Payment intent fails
**Solution**:
1. Check braider country in braider_profiles
2. Call `/api/payments/resolve-provider` to verify provider
3. Check Stripe/Paystack API keys in environment
4. Check payment amount is positive

### Issue: Chat messages don't appear
**Solution**:
1. Check conversations table: Does conversation exist?
2. Check messages table: Are messages inserted?
3. Check real-time subscription: Is it active?
4. Refresh page and try again

---

## NEXT PHASE

Once all tests pass:

1. **Phase 2**: Session Persistence & Auth Store
   - Update localStorage persistence
   - Add session recovery

2. **Phase 3**: RLS Policies
   - Re-enable RLS
   - Create proper access control

3. **Phase 4**: Comprehensive Testing
   - Load testing
   - Payment processing
   - Error scenarios

---

## DEPLOYMENT CHECKLIST

- [ ] Database migration executed successfully
- [ ] All code changes deployed
- [ ] All 10 tests passed
- [ ] No errors in logs
- [ ] Ready for Phase 2

**Status**: 🟢 READY FOR TESTING
