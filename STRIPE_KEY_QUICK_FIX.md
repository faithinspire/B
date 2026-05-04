# Stripe Authentication Failed - Quick Fix 🔧

## The Problem
```
❌ Stripe authentication failed. Check API key.
```

Your `.env.local` has **invalid/placeholder Stripe keys** that don't match Stripe's key format.

## The Fix (3 Steps)

### 1️⃣ Get Real Keys
- Go to https://dashboard.stripe.com
- Click **Developers** → **API Keys**
- Copy your **Publishable Key** and **Secret Key**

### 2️⃣ Update `.env.local`
Replace the placeholder keys with your real keys:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

### 3️⃣ Restart Server
```bash
npm run dev
```

## Current Invalid Keys

❌ **Publishable Key:** `pk_live_[INVALID_FORMAT]`
- Too short (should be 50+ chars)
- Appears to be dummy/placeholder

❌ **Secret Key:** `sk_live_[INVALID_FORMAT]`
- Too short (should be 50+ chars)
- Same as Paystack key (wrong!)

## Bonus Issue: Paystack Key

The Paystack key is identical to Stripe key (incorrect - both need real keys):

Get real Paystack keys from: https://dashboard.paystack.com

## Test Cards (When Using Test Keys)

| Card | Expiry | CVC | Result |
|------|--------|-----|--------|
| 4242 4242 4242 4242 | Any future | Any 3 | ✅ Success |
| 4000 0000 0000 0002 | Any future | Any 3 | ❌ Decline |

## Validation

Your keys must match:
- ✅ Start with `pk_test_` or `pk_live_` (publishable)
- ✅ Start with `sk_test_` or `sk_live_` (secret)
- ✅ Be 50+ characters long

Current keys fail validation ❌

---

**Action Required:** Get real Stripe keys and update `.env.local`
