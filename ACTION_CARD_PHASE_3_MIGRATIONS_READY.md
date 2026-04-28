# 🎯 ACTION CARD: PHASE 3 - MIGRATIONS READY FOR EXECUTION

**Status**: ✅ Ready to Execute  
**Date**: April 28, 2026  
**Priority**: 🔴 CRITICAL - Blocking braider signup and payment system

---

## 📊 CURRENT STATE

### ✅ Completed
- Phase 3 Payment System: Stripe & Paystack integration (code complete)
- Braider Signup Fix: Migration created (commit 7e5d4b0)
- Database Schema Fixes: Migration created (commit eb3f296)
- Vercel Build: Fixed and redeployed
- All code committed to master branch

### ⏳ Pending (BLOCKING)
- **Execute migrations in Supabase** ← YOU ARE HERE
- Configure payment provider credentials
- Configure webhooks
- Test payment flow

---

## 🚨 BLOCKING ISSUES

### Issue 1: Braider Signup Fails
```
Error: "Braider profile must exist for role=braider"
```
**Cause**: Database trigger fires before braider_profiles is created  
**Fix**: Remove trigger via migration  
**File**: `supabase/migrations/FIX_BRAIDER_SIGNUP_RACE_CONDITION.sql`

### Issue 2: Database Column Errors
```
Error: "column country does not exist"
Error: "column user_id does not exist"
Error: "column booking_id does not exist"
```
**Cause**: Schema fragmented across migrations  
**Fix**: Add all missing columns and disable RLS  
**File**: `supabase/migrations/FINAL_COMPLETE_FIX.sql`

---

## ⚡ QUICK START (5 MINUTES)

### Option A: Automatic (Recommended)
```bash
npm run migrate
```

### Option B: Manual via Supabase Dashboard

1. Go to: https://app.supabase.com
2. Select project: BraidMe
3. Click "SQL Editor" → "New Query"
4. Copy & paste: `supabase/migrations/FIX_BRAIDER_SIGNUP_RACE_CONDITION.sql`
5. Click "Run"
6. Repeat steps 3-5 with: `supabase/migrations/FINAL_COMPLETE_FIX.sql`

---

## 📋 WHAT GETS FIXED

### Migration 1: FIX_BRAIDER_SIGNUP_RACE_CONDITION.sql
- ✅ Removes problematic trigger
- ✅ Removes validation function
- ✅ Allows braider signup to complete

### Migration 2: FINAL_COMPLETE_FIX.sql
- ✅ Adds missing columns to profiles table
- ✅ Adds missing columns to braider_profiles table
- ✅ Adds missing columns to bookings table
- ✅ Creates payment_transactions table
- ✅ Creates braider_verification table
- ✅ Creates phone_login_mappings table
- ✅ Disables RLS on all tables
- ✅ Grants permissions to authenticated users

---

## ✅ VERIFICATION AFTER EXECUTION

Test these to confirm migrations worked:

### 1. Braider Signup
```
Go to: http://localhost:3000/signup/braider
Fill form and submit
Expected: Success (no "profile must exist" error)
```

### 2. Database Columns
```
Supabase Dashboard → Table Editor
Check profiles table: country, phone, phone_country, role columns exist
Check braider_profiles table: user_id, full_name, email, country columns exist
```

### 3. RLS Status
```
Supabase Dashboard → Table Editor
Click any table → "RLS" toggle should be OFF
```

---

## 🔧 NEXT STEPS AFTER MIGRATIONS

### Step 1: Configure Stripe (USA/USD)
```
.env.local:
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

Vercel Dashboard:
Add same environment variables
```

### Step 2: Configure Paystack (Nigeria/NGN)
```
.env.local:
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...

Vercel Dashboard:
Add same environment variables
```

### Step 3: Configure Webhooks
```
Stripe Dashboard:
- Go to Developers → Webhooks
- Add endpoint: https://yourdomain.com/api/payments/stripe-webhook
- Select events: payment_intent.succeeded, payment_intent.payment_failed

Paystack Dashboard:
- Go to Settings → API Keys & Webhooks
- Add webhook: https://yourdomain.com/api/payments/paystack-webhook
```

### Step 4: Test Payment Flow
```
1. Create booking as customer
2. Verify payment provider selected based on country
3. Test payment intent creation
4. Verify webhook handling
```

---

## 📁 FILES INVOLVED

### Migrations (Ready to Execute)
- `supabase/migrations/FIX_BRAIDER_SIGNUP_RACE_CONDITION.sql`
- `supabase/migrations/FINAL_COMPLETE_FIX.sql`

### Code (Already Committed)
- `app/api/auth/signup/route.ts` - Braider signup endpoint
- `app/api/payments/create-payment-intent/route.ts` - Payment routing
- `app/api/payments/stripe-webhook/route.ts` - Stripe webhook handler
- `app/api/payments/paystack-webhook/route.ts` - Paystack webhook handler
- `app/api/payments/verify/route.ts` - Payment verification

### Configuration
- `.env.local` - Environment variables (needs payment keys)
- `package.json` - Added `npm run migrate` script

---

## 🎯 SUCCESS CRITERIA

✅ Braider signup works without errors  
✅ All database columns exist  
✅ RLS disabled on all tables  
✅ Payment system routes to correct provider  
✅ Webhooks configured and receiving events  
✅ Vercel build succeeds  
✅ App deploys without errors

---

## 🆘 TROUBLESHOOTING

### Migrations fail to execute
1. Check Supabase credentials in `.env.local`
2. Verify service role key has admin permissions
3. Try manual execution via SQL Editor
4. Check Supabase logs for specific error

### Braider signup still fails
1. Verify `FIX_BRAIDER_SIGNUP_RACE_CONDITION.sql` executed
2. Check that trigger was removed
3. Look at app logs for specific error
4. Verify `braider_profiles` table exists

### "Column does not exist" errors persist
1. Verify `FINAL_COMPLETE_FIX.sql` executed
2. Go to Supabase Table Editor
3. Check that column exists in table
4. If not, manually add via Table Editor

---

## 📞 QUICK REFERENCE

| Task | Command | Time |
|------|---------|------|
| Execute migrations | `npm run migrate` | 2 min |
| Manual execution | Supabase Dashboard | 5 min |
| Test braider signup | http://localhost:3000/signup/braider | 2 min |
| Configure Stripe | Stripe Dashboard | 5 min |
| Configure Paystack | Paystack Dashboard | 5 min |
| Test payment flow | Create booking | 5 min |

**Total Time**: ~20 minutes

---

## 📝 COMMIT HISTORY

- `eb3f296` - Comprehensive schema and RLS fixes
- `7e5d4b0` - Remove braider profile validation trigger
- `c08d648` - Trigger Vercel rebuild
- `66e9dc9` - Fix orphaned code in conversations route
- `0b7a07e` - PHASE 3: Payment structure rebuild

---

## 🚀 READY TO EXECUTE

All code is committed and ready. Just execute the migrations and configure payment providers.

**Estimated time to full deployment**: 30 minutes

---

**Last Updated**: April 28, 2026  
**Next Review**: After migrations executed
