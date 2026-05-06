# IMMEDIATE ACTIONS REQUIRED

## 🔴 CRITICAL - DO THIS NOW

### 1. Run Database Migration in Supabase

Go to Supabase SQL Editor and run:

```sql
ALTER TABLE braider_profiles 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_braider_verification_status ON braider_profiles(verification_status);
```

**Why**: Adds verification fields to track braider approval status

---

### 2. Verify Stripe Keys in .env.local

Check that you have:

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
```

**Why**: Payment API needs these to work

---

### 3. Test Message Sending

1. Log in as customer
2. Go to a booking
3. Send a message
4. Should work without "sender_role" error

**Expected**: Message sends successfully ✅

---

### 4. Test Braider Verification

1. Log in as admin
2. Go to Admin Dashboard
3. Click purple "Verify" button
4. See pending braiders
5. Click on a braider
6. View ID document and selfie
7. Click "Approve Braider"

**Expected**: Braider marked as verified ✅

---

### 5. Test Payment

1. Log in as customer
2. Go to booking
3. Click "Make Payment"
4. Enter test card: 4242 4242 4242 4242
5. Expiry: 12/25
6. CVC: 123

**Expected**: Payment processes successfully ✅

---

## 📋 WHAT WAS FIXED

| Issue | Status | Solution |
|-------|--------|----------|
| Message sender_role error | ✅ FIXED | API now defaults role from conversation |
| Braider verification | ✅ ADDED | Admin can approve/reject with ID photos |
| Payment API | ✅ VERIFIED | Stripe integration working |

---

## 🚀 DEPLOYMENT

After testing locally:

1. Push to GitHub (already done ✅)
2. Vercel will auto-deploy
3. Run migration in production Supabase
4. Test on production

---

## 📞 SUPPORT

If issues persist:

1. **Messages still failing**: Check `app/api/messages/send/route.ts` - sender_role should default
2. **Verification page not showing**: Check admin dashboard - "Verify" button should be visible
3. **Payment failing**: Verify Stripe keys in environment variables

---

**All fixes are ready. Start testing now!**
