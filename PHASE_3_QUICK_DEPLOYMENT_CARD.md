# ⚡ PHASE 3: QUICK DEPLOYMENT CARD

## 🎯 WHAT'S BEING DEPLOYED

Complete payment system rebuild with:
- ✅ Stripe for USD/US payments
- ✅ Paystack for NGN/Nigeria payments
- ✅ Automatic provider routing based on country
- ✅ Webhook handlers for both providers
- ✅ Payment transaction audit trail

---

## 📋 DEPLOYMENT STEPS (5 MINUTES)

### 1️⃣ DATABASE MIGRATION (Supabase)
```
1. Go to Supabase → SQL Editor
2. Create new query
3. Copy: supabase/migrations/PHASE_3_PAYMENT_STRUCTURE_REBUILD.sql
4. Paste and Run
5. Verify no errors
```

### 2️⃣ ENVIRONMENT VARIABLES (Local)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYSTACK_SECRET_KEY=ssk_live_...
```

### 3️⃣ ENVIRONMENT VARIABLES (Vercel)
```
Settings → Environment Variables
Add same 3 variables above
```

### 4️⃣ WEBHOOKS (Stripe)
```
Stripe Dashboard → Developers → Webhooks
Add endpoint: https://yourdomain.com/api/payments/stripe-webhook
Events: payment_intent.succeeded, payment_intent.payment_failed
Copy signing secret → STRIPE_WEBHOOK_SECRET
```

### 5️⃣ WEBHOOKS (Paystack)
```
Paystack Dashboard → Settings → Webhooks
Add URL: https://yourdomain.com/api/payments/paystack-webhook
Save
```

### 6️⃣ GIT COMMIT & PUSH
```bash
git add app/api/payments/ supabase/migrations/PHASE_3_*
git commit -m "PHASE 3: Payment structure rebuild - Stripe & Paystack"
git push origin master
```

---

## 🧪 QUICK TEST

### Test Stripe (US):
```bash
curl -X POST http://localhost:3000/api/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"test","customerId":"cust","braiderCountry":"US","amount":50}'
```

### Test Paystack (NG):
```bash
curl -X POST http://localhost:3000/api/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"test","customerId":"cust","braiderCountry":"NG","amount":5000}'
```

---

## 📊 PAYMENT ROUTING

| Country | Provider | Currency | Amount Format |
|---------|----------|----------|---------------|
| US | Stripe | USD | Cents (50 = $0.50) |
| NG | Paystack | NGN | Kobo (5000 = ₦50) |

---

## 🔗 NEW ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/create-payment-intent` | POST | Create payment |
| `/api/payments/stripe-webhook` | POST | Stripe webhook |
| `/api/payments/paystack-webhook` | POST | Paystack webhook |
| `/api/payments/verify` | POST | Verify payment |

---

## ✅ VERIFICATION CHECKLIST

- [ ] Database migration executed
- [ ] Environment variables set (local)
- [ ] Environment variables set (Vercel)
- [ ] Stripe webhook configured
- [ ] Paystack webhook configured
- [ ] Stripe test passed
- [ ] Paystack test passed
- [ ] Git commit pushed
- [ ] Vercel deployment complete

---

## 🚨 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| 500 error on payment | Check env vars in `.env.local` |
| Webhook not received | Verify webhook URL in provider dashboard |
| Payment not updating | Check webhook secret is correct |
| Wrong provider used | Verify braider country in database |

---

## 📚 DOCUMENTATION

- Full guide: `PHASE_3_DEPLOYMENT_ACTION_GUIDE.md`
- Architecture: `PHASE_3_PAYMENT_STRUCTURE_REBUILD_COMPLETE.md`
- Database: `supabase/migrations/PHASE_3_PAYMENT_STRUCTURE_REBUILD.sql`

---

## 🎉 AFTER DEPLOYMENT

1. Update frontend to call new payment endpoint
2. Remove old payment endpoint
3. Monitor payment logs
4. Test with real payments

---

**Status**: 🟢 READY TO DEPLOY

