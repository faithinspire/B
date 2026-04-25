# Vercel Environment Variables Setup - Current Session

## 🔑 Required Environment Variables

Add these to your Vercel project settings:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Stripe Configuration (USA Payments)
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### Paystack Configuration (Nigeria Payments)
```
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
```

---

## 📝 How to Add to Vercel

### Step 1: Go to Vercel Dashboard
1. Navigate to https://vercel.com/dashboard
2. Select your project
3. Click "Settings"
4. Click "Environment Variables"

### Step 2: Add Each Variable
For each variable above:
1. Click "Add New"
2. Enter the variable name
3. Enter the value
4. Select which environments (Production, Preview, Development)
5. Click "Save"

### Step 3: Redeploy
After adding all variables:
1. Go to "Deployments"
2. Click the three dots on the latest deployment
3. Click "Redeploy"

---

## 🔐 Getting Your Keys

### Supabase Keys
1. Go to https://app.supabase.com
2. Select your project
3. Click "Settings" → "API"
4. Copy the URLs and keys

### Stripe Keys
1. Go to https://dashboard.stripe.com
2. Click "Developers" → "API Keys"
3. Copy your Secret Key and Publishable Key

### Paystack Keys
1. Go to https://dashboard.paystack.com
2. Click "Settings" → "API Keys & Webhooks"
3. Copy your Secret Key and Public Key

---

## ✅ Verification

After deployment, verify by:

1. **Test Nigeria Payment**
   - Create a booking with a Nigerian braider
   - Should redirect to Paystack payment page

2. **Test USA Payment**
   - Create a booking with a USA braider
   - Should redirect to Stripe payment page

3. **Check Logs**
   - Go to Vercel → Deployments → Logs
   - Look for payment gateway initialization messages

---

## 🚨 Common Issues

### "Stripe authentication failed"
- Check if `STRIPE_SECRET_KEY` is set correctly
- Verify it's the Secret Key, not Publishable Key
- Make sure it starts with `sk_live_` or `sk_test_`

### "Paystack error: Invalid key"
- Check if `PAYSTACK_SECRET_KEY` is set correctly
- Verify it starts with `sk_live_` or `sk_test_`
- Make sure you're using the Secret Key, not Public Key

### "Environment variable not found"
- Redeploy after adding variables
- Wait 2-3 minutes for changes to take effect
- Check that variable is set for "Production" environment

---

## 📋 Checklist

- [ ] Added NEXT_PUBLIC_SUPABASE_URL
- [ ] Added NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Added SUPABASE_SERVICE_ROLE_KEY
- [ ] Added STRIPE_SECRET_KEY
- [ ] Added STRIPE_PUBLISHABLE_KEY
- [ ] Added NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] Added PAYSTACK_SECRET_KEY
- [ ] Added NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
- [ ] Redeployed project
- [ ] Tested Nigeria payment flow
- [ ] Tested USA payment flow

---

## 🎯 Next Steps

1. Add all environment variables to Vercel
2. Redeploy the project
3. Test payment flows
4. Monitor logs for any errors
5. Go live!
