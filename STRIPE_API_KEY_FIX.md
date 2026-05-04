# Stripe Authentication Failed - API Key Issue ❌

## Problem Identified

The Stripe API keys in `.env.local` are **invalid/placeholder keys**:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[INVALID_KEY]
STRIPE_SECRET_KEY=sk_live_[INVALID_KEY]
```

These keys are **not real Stripe keys** - they appear to be dummy/placeholder values that don't match Stripe's key format.

## Error Message

When Stripe receives these invalid keys, it returns:
```
Stripe authentication failed. Check API key.
Code: STRIPE_AUTH_ERROR
```

## Solution

You need to replace these with **real Stripe API keys** from your Stripe dashboard.

### Step 1: Get Your Real Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Log in to your Stripe account
3. Navigate to **Developers** → **API Keys**
4. You'll see two keys:
   - **Publishable Key** (starts with `pk_live_` or `pk_test_`)
   - **Secret Key** (starts with `sk_live_` or `sk_test_`)

### Step 2: Choose Test or Live Keys

**For Development/Testing:**
- Use keys starting with `pk_test_` and `sk_test_`
- These are safe for testing without real charges

**For Production:**
- Use keys starting with `pk_live_` and `sk_live_`
- These process real payments

### Step 3: Update `.env.local`

Replace the placeholder keys with your real keys:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_ACTUAL_WEBHOOK_SECRET
```

### Step 4: Get Webhook Secret (Optional but Recommended)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Copy the **Signing Secret** (starts with `whsec_`)
4. Update `STRIPE_WEBHOOK_SECRET` in `.env.local`

## Current Configuration Issues

### Issue 1: Invalid Key Format
The current keys don't match real Stripe key patterns:
- Real keys are much longer (typically 50+ characters)
- Current keys appear to be truncated or dummy values

### Issue 2: Mismatched Keys
The Paystack key is identical to the Stripe secret key (incorrect):
```
PAYSTACK_SECRET_KEY=[INVALID_KEY]
STRIPE_SECRET_KEY=[INVALID_KEY]
```

This is incorrect - Paystack and Stripe have completely different keys.

## How to Get Paystack Keys (If Using Paystack)

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** → **API Keys & Webhooks**
3. Copy your **Secret Key** and **Public Key**
4. Update `.env.local`:

```env
PAYSTACK_SECRET_KEY=sk_live_YOUR_PAYSTACK_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PAYSTACK_PUBLIC_KEY
```

## Verification Steps

After updating the keys:

1. **Restart the development server:**
   ```bash
   npm run dev
   ```

2. **Test payment creation:**
   - Go to booking page
   - Try to create a payment
   - Should no longer see "Stripe authentication failed"

3. **Check logs:**
   - Look for `[stripe]` prefixed logs
   - Should show successful payment intent creation

## Key Validation

The code validates Stripe keys:

```typescript
// Must start with sk_test_ or sk_live_
if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
  return { error: 'Invalid Stripe key format' };
}
```

Your current key fails this validation.

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to Git (it's in `.gitignore`)
- Keep secret keys private
- Use test keys for development
- Use live keys only in production
- Rotate keys if compromised

## Testing with Stripe Test Keys

When using `sk_test_` keys, use these test card numbers:

| Card Number | Expiry | CVC | Result |
|-------------|--------|-----|--------|
| 4242 4242 4242 4242 | Any future date | Any 3 digits | Success |
| 4000 0000 0000 0002 | Any future date | Any 3 digits | Decline |
| 4000 0025 0000 3155 | Any future date | Any 3 digits | Requires auth |

## Next Steps

1. ✅ Get real Stripe API keys from Stripe Dashboard
2. ✅ Update `.env.local` with real keys
3. ✅ Restart development server
4. ✅ Test payment flow
5. ✅ Verify no more authentication errors

---

**Status:** 🔴 BLOCKED - Waiting for real Stripe API keys

Once you provide the real keys, the payment system will work correctly.
