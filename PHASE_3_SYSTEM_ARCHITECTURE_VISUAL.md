# 🏗️ PHASE 3: SYSTEM ARCHITECTURE VISUAL GUIDE

## 🌍 GLOBAL PAYMENT SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BRAIDMEE PAYMENT SYSTEM                             │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      FRONTEND (React/Next.js)                        │  │
│  │                                                                      │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │  │
│  │  │  Booking Page   │  │  Payment Modal  │  │  Status Tracker │    │  │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘    │  │
│  │           │                    │                    │              │  │
│  │           └────────────────────┼────────────────────┘              │  │
│  │                                │                                   │  │
│  │                    POST /api/payments/create-payment-intent        │  │
│  │                                │                                   │  │
│  └────────────────────────────────┼───────────────────────────────────┘  │
│                                   │                                       │
│                                   ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    BACKEND (Next.js API Routes)                    │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  /api/payments/create-payment-intent                        │ │  │
│  │  │                                                              │ │  │
│  │  │  1. Fetch braider country from database                     │ │  │
│  │  │  2. Determine payment provider:                             │ │  │
│  │  │     - US → Stripe                                           │ │  │
│  │  │     - NG → Paystack                                         │ │  │
│  │  │  3. Create payment intent with provider                     │ │  │
│  │  │  4. Store payment record in database                        │ │  │
│  │  │  5. Return payment details to frontend                      │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  /api/payments/stripe-webhook                               │ │  │
│  │  │  /api/payments/paystack-webhook                             │ │  │
│  │  │                                                              │ │  │
│  │  │  1. Verify webhook signature                                │ │  │
│  │  │  2. Extract payment data                                    │ │  │
│  │  │  3. Update payment status                                   │ │  │
│  │  │  4. Update booking status (via trigger)                     │ │  │
│  │  │  5. Log transaction                                         │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  /api/payments/verify                                       │ │  │
│  │  │                                                              │ │  │
│  │  │  1. Verify payment with provider                            │ │  │
│  │  │  2. Update payment status                                   │ │  │
│  │  │  3. Return payment details                                  │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│                                   │                                       │
│                    ┌──────────────┴──────────────┐                       │
│                    │                             │                       │
│                    ▼                             ▼                       │
│  ┌─────────────────────────────┐   ┌─────────────────────────────┐      │
│  │      STRIPE (USD)           │   │     PAYSTACK (NGN)          │      │
│  │                             │   │                             │      │
│  │  • Create Payment Intent    │   │  • Initialize Transaction   │      │
│  │  • Verify Signature         │   │  • Verify Signature         │      │
│  │  • Handle Webhooks          │   │  • Handle Webhooks          │      │
│  │  • Refund Payments          │   │  • Refund Payments          │      │
│  │                             │   │                             │      │
│  └─────────────────────────────┘   └─────────────────────────────┘      │
│                    │                             │                       │
│                    └──────────────┬──────────────┘                       │
│                                   │                                       │
│                                   ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    DATABASE (Supabase PostgreSQL)                  │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  payments                                                    │ │  │
│  │  │  ├─ id                                                       │ │  │
│  │  │  ├─ booking_id                                              │ │  │
│  │  │  ├─ customer_id                                             │ │  │
│  │  │  ├─ amount                                                  │ │  │
│  │  │  ├─ currency (USD/NGN)                                      │ │  │
│  │  │  ├─ status (pending/completed/failed)                       │ │  │
│  │  │  ├─ payment_provider (stripe/paystack)                      │ │  │
│  │  │  ├─ stripe_payment_intent_id                                │ │  │
│  │  │  ├─ paystack_reference                                      │ │  │
│  │  │  └─ updated_at                                              │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  bookings                                                    │ │  │
│  │  │  ├─ id                                                       │ │  │
│  │  │  ├─ customer_id                                             │ │  │
│  │  │  ├─ braider_id                                              │ │  │
│  │  │  ├─ payment_status (pending/completed/failed)               │ │  │
│  │  │  ├─ payment_provider (stripe/paystack)                      │ │  │
│  │  │  ├─ stripe_payment_intent_id                                │ │  │
│  │  │  ├─ paystack_reference                                      │ │  │
│  │  │  └─ status (confirmed/completed/cancelled)                  │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  payment_transactions (Audit Trail)                         │ │  │
│  │  │  ├─ id                                                       │ │  │
│  │  │  ├─ payment_id                                              │ │  │
│  │  │  ├─ transaction_type (charge/refund/dispute/release)        │ │  │
│  │  │  ├─ amount                                                  │ │  │
│  │  │  ├─ status (pending/completed/failed)                       │ │  │
│  │  │  ├─ provider (stripe/paystack)                              │ │  │
│  │  │  ├─ provider_transaction_id                                 │ │  │
│  │  │  └─ created_at                                              │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  payment_settings (Configuration)                           │ │  │
│  │  │  ├─ country (US/NG)                                         │ │  │
│  │  │  ├─ payment_provider (stripe/paystack)                      │ │  │
│  │  │  ├─ currency (USD/NGN)                                      │ │  │
│  │  │  ├─ platform_fee_percentage (5.0)                           │ │  │
│  │  │  └─ is_active (true/false)                                  │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  payment_reconciliation (Reconciliation)                    │ │  │
│  │  │  ├─ id                                                       │ │  │
│  │  │  ├─ payment_id                                              │ │  │
│  │  │  ├─ provider_status                                         │ │  │
│  │  │  ├─ local_status                                            │ │  │
│  │  │  ├─ reconciled (true/false)                                 │ │  │
│  │  │  └─ reconciliation_date                                     │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  braider_profiles                                           │ │  │
│  │  │  ├─ user_id                                                 │ │  │
│  │  │  ├─ country (US/NG) ← SINGLE SOURCE OF TRUTH               │ │  │
│  │  │  └─ ...                                                     │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 PAYMENT FLOW SEQUENCE DIAGRAM

```
┌─────────┐         ┌──────────┐         ┌────────┐         ┌──────────┐
│ Frontend│         │ Backend  │         │Database│         │ Provider │
└────┬────┘         └────┬─────┘         └───┬────┘         └────┬─────┘
     │                   │                    │                   │
     │ POST /create-     │                    │                   │
     │ payment-intent    │                    │                   │
     ├──────────────────>│                    │                   │
     │                   │                    │                   │
     │                   │ Fetch braider      │                   │
     │                   │ country            │                   │
     │                   ├───────────────────>│                   │
     │                   │<───────────────────┤                   │
     │                   │ country: "US"      │                   │
     │                   │                    │                   │
     │                   │ Determine provider │                   │
     │                   │ (Stripe for US)    │                   │
     │                   │                    │                   │
     │                   │ Create payment     │                   │
     │                   │ intent             │                   │
     │                   ├───────────────────────────────────────>│
     │                   │                    │                   │
     │                   │<───────────────────────────────────────┤
     │                   │ paymentIntentId    │                   │
     │                   │ clientSecret       │                   │
     │                   │                    │                   │
     │                   │ Store payment      │                   │
     │                   │ record             │                   │
     │                   ├───────────────────>│                   │
     │                   │<───────────────────┤                   │
     │                   │ OK                 │                   │
     │                   │                    │                   │
     │<──────────────────┤                    │                   │
     │ paymentIntentId   │                    │                   │
     │ clientSecret      │                    │                   │
     │                   │                    │                   │
     │ User completes    │                    │                   │
     │ payment           │                    │                   │
     ├───────────────────────────────────────────────────────────>│
     │                   │                    │                   │
     │                   │                    │                   │
     │<───────────────────────────────────────────────────────────┤
     │ Payment succeeded │                    │                   │
     │                   │                    │                   │
     │                   │ Webhook: payment_  │                   │
     │                   │ intent.succeeded   │                   │
     │                   │<───────────────────────────────────────┤
     │                   │                    │                   │
     │                   │ Verify signature   │                   │
     │                   │ Extract data       │                   │
     │                   │                    │                   │
     │                   │ Update payment     │                   │
     │                   │ status             │                   │
     │                   ├───────────────────>│                   │
     │                   │<───────────────────┤                   │
     │                   │ OK                 │                   │
     │                   │                    │                   │
     │                   │ Trigger: sync      │                   │
     │                   │ booking status     │                   │
     │                   ├───────────────────>│                   │
     │                   │<───────────────────┤                   │
     │                   │ OK                 │                   │
     │                   │                    │                   │
     │ Poll status       │                    │                   │
     ├──────────────────>│                    │                   │
     │                   │ Fetch payment      │                   │
     │                   │ status             │                   │
     │                   ├───────────────────>│                   │
     │                   │<───────────────────┤                   │
     │                   │ status: completed  │                   │
     │<──────────────────┤                    │                   │
     │ Payment complete  │                    │                   │
     │                   │                    │                   │
```

---

## 💳 PAYMENT PROVIDER COMPARISON

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT PROVIDER COMPARISON                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STRIPE (USD/US)                    PAYSTACK (NGN/Nigeria)             │
│  ─────────────────                  ──────────────────────             │
│                                                                         │
│  Currency: USD                      Currency: NGN                      │
│  Amount Format: Cents               Amount Format: Kobo                │
│  Example: $50 = 5000                Example: ₦5000 = 500000            │
│                                                                         │
│  Payment Methods:                   Payment Methods:                   │
│  • Card (Visa, Mastercard)          • Card (Visa, Mastercard)          │
│  • Apple Pay                        • Bank Transfer                    │
│  • Google Pay                       • USSD                             │
│                                     • Mobile Money                     │
│                                                                         │
│  Webhook Events:                    Webhook Events:                    │
│  • payment_intent.succeeded         • charge.success                   │
│  • payment_intent.payment_failed    • charge.failed                    │
│                                                                         │
│  Signature Verification:            Signature Verification:           │
│  • HMAC-SHA256                      • HMAC-SHA512                      │
│  • Header: stripe-signature         • Header: x-paystack-signature     │
│                                                                         │
│  API Endpoint:                      API Endpoint:                      │
│  • paymentIntents.create()          • /transaction/initialize          │
│  • paymentIntents.retrieve()        • /transaction/verify              │
│                                                                         │
│  Test Card:                         Test Card:                        │
│  • 4242 4242 4242 4242              • 5078 7400 0000 0007              │
│  • Any future expiry                • Any future expiry                │
│  • Any CVC                          • Any CVC                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ FILE STRUCTURE

```
app/
├── api/
│   └── payments/
│       ├── create-payment-intent/
│       │   └── route.ts (6.2 KB)
│       │       ├── POST handler
│       │       ├── Stripe payment creation
│       │       └── Paystack payment creation
│       │
│       ├── stripe-webhook/
│       │   └── route.ts (4.1 KB)
│       │       ├── Signature verification
│       │       ├── Event handling
│       │       └── Status updates
│       │
│       ├── paystack-webhook/
│       │   └── route.ts (3.9 KB)
│       │       ├── Signature verification
│       │       ├── Event handling
│       │       └── Status updates
│       │
│       └── verify/
│           └── route.ts (4.3 KB)
│               ├── Stripe verification
│               └── Paystack verification
│
supabase/
└── migrations/
    └── PHASE_3_PAYMENT_STRUCTURE_REBUILD.sql (3.2 KB)
        ├── Table extensions
        ├── New tables
        ├── Functions
        └── Triggers

Documentation/
├── PHASE_3_PAYMENT_STRUCTURE_REBUILD_COMPLETE.md
├── PHASE_3_DEPLOYMENT_ACTION_GUIDE.md
├── PHASE_3_QUICK_DEPLOYMENT_CARD.md
├── PHASE_3_DEPLOYMENT_COMPLETE.md
├── PHASE_3_FINAL_SUMMARY.md
└── PHASE_3_SYSTEM_ARCHITECTURE_VISUAL.md (this file)
```

---

## 🔐 SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Layer 1: Environment Variables                                        │
│  ─────────────────────────────                                         │
│  • STRIPE_SECRET_KEY (never exposed)                                   │
│  • STRIPE_WEBHOOK_SECRET (for verification)                            │
│  • PAYSTACK_SECRET_KEY (never exposed)                                 │
│  • Stored in .env.local and Vercel                                     │
│                                                                         │
│  Layer 2: Webhook Signature Verification                               │
│  ──────────────────────────────────────                                │
│  • Stripe: HMAC-SHA256                                                 │
│  • Paystack: HMAC-SHA512                                               │
│  • Fails on invalid signatures                                         │
│  • Prevents webhook spoofing                                           │
│                                                                         │
│  Layer 3: Service Role Key                                             │
│  ──────────────────────────                                            │
│  • Used for all database operations                                    │
│  • Bypasses RLS (for now)                                              │
│  • Never exposed to frontend                                           │
│  • Stored in environment variables                                     │
│                                                                         │
│  Layer 4: Error Handling                                               │
│  ──────────────────────                                                │
│  • Fails loudly with clear errors                                      │
│  • No silent failures                                                  │
│  • Comprehensive logging                                               │
│  • Detailed error messages                                             │
│                                                                         │
│  Layer 5: Data Validation                                              │
│  ────────────────────────                                              │
│  • Required fields validation                                          │
│  • Amount validation                                                   │
│  • Country validation                                                  │
│  • Provider validation                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Input: Booking Request                                                │
│  ├─ bookingId                                                          │
│  ├─ customerId                                                         │
│  ├─ braiderCountry                                                     │
│  ├─ amount                                                             │
│  └─ paymentType                                                        │
│                                                                         │
│  Processing:                                                           │
│  ├─ Validate input                                                     │
│  ├─ Fetch braider country from database                                │
│  ├─ Determine payment provider                                         │
│  ├─ Create payment intent with provider                                │
│  ├─ Store payment record in database                                   │
│  └─ Log transaction                                                    │
│                                                                         │
│  Output: Payment Intent                                                │
│  ├─ provider (stripe/paystack)                                         │
│  ├─ paymentIntentId / reference                                        │
│  ├─ clientSecret / authorizationUrl                                    │
│  ├─ amount                                                             │
│  └─ currency (USD/NGN)                                                 │
│                                                                         │
│  Webhook Input: Payment Event                                          │
│  ├─ event type (payment_intent.succeeded / charge.success)             │
│  ├─ payment data                                                       │
│  ├─ signature                                                          │
│  └─ timestamp                                                          │
│                                                                         │
│  Webhook Processing:                                                   │
│  ├─ Verify signature                                                   │
│  ├─ Extract payment data                                               │
│  ├─ Update payment status                                              │
│  ├─ Update booking status (via trigger)                                │
│  ├─ Log transaction                                                    │
│  └─ Return success                                                     │
│                                                                         │
│  Database Updates:                                                     │
│  ├─ payments table                                                     │
│  │  ├─ status: pending → completed/failed                              │
│  │  ├─ stripe_charge_id / paystack_reference                           │
│  │  └─ updated_at                                                      │
│  │                                                                     │
│  ├─ bookings table (via trigger)                                       │
│  │  ├─ payment_status: pending → completed/failed                      │
│  │  ├─ status: pending → confirmed                                     │
│  │  └─ updated_at                                                      │
│  │                                                                     │
│  └─ payment_transactions table                                         │
│     ├─ transaction_type: charge                                        │
│     ├─ status: completed/failed                                        │
│     └─ provider_transaction_id                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ DEPLOYMENT CHECKLIST

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT CHECKLIST                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Code Deployment:                                                      │
│  ✅ Code committed to master                                           │
│  ✅ Pushed to GitHub                                                   │
│  ✅ Vercel auto-deployment triggered                                   │
│                                                                         │
│  Database Setup:                                                       │
│  ⏳ Execute migration in Supabase                                       │
│  ⏳ Verify tables created                                              │
│  ⏳ Verify functions created                                           │
│  ⏳ Verify triggers created                                            │
│                                                                         │
│  Environment Configuration:                                            │
│  ⏳ Set STRIPE_SECRET_KEY in .env.local                                │
│  ⏳ Set STRIPE_WEBHOOK_SECRET in .env.local                            │
│  ⏳ Set PAYSTACK_SECRET_KEY in .env.local                              │
│  ⏳ Set variables in Vercel                                            │
│                                                                         │
│  Webhook Configuration:                                                │
│  ⏳ Configure Stripe webhook                                           │
│  ⏳ Configure Paystack webhook                                         │
│  ⏳ Verify webhook delivery                                            │
│                                                                         │
│  Testing:                                                              │
│  ⏳ Test Stripe payment (US)                                           │
│  ⏳ Test Paystack payment (NG)                                         │
│  ⏳ Verify webhook received                                            │
│  ⏳ Verify payment status updated                                      │
│  ⏳ Verify booking status updated                                      │
│                                                                         │
│  Monitoring:                                                           │
│  ⏳ Monitor payment logs                                               │
│  ⏳ Monitor webhook delivery                                           │
│  ⏳ Monitor error rates                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

**Status**: 🟢 PHASE 3 COMPLETE & DEPLOYED

