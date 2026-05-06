# Booking Flow - Visual Guide

## Complete Booking Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER BOOKING FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. CUSTOMER OPENS BOOKING PAGE
   ┌──────────────────────────────────────────┐
   │  GET /booking                            │
   │  ↓                                       │
   │  Page loads                              │
   │  ↓                                       │
   │  Calls GET /api/braiders                 │
   │  ↓                                       │
   │  API returns braiders list               │
   │  ↓                                       │
   │  Page displays braiders                  │
   └──────────────────────────────────────────┘

2. CUSTOMER SELECTS BRAIDER (STEP 1)
   ┌──────────────────────────────────────────┐
   │  User clicks on braider                  │
   │  ↓                                       │
   │  Page calls GET /api/services            │
   │  ↓                                       │
   │  API returns services for braider        │
   │  ↓                                       │
   │  Page displays services                  │
   │  ↓                                       │
   │  User clicks "Next"                      │
   └──────────────────────────────────────────┘

3. CUSTOMER SELECTS SERVICE (STEP 2)
   ┌──────────────────────────────────────────┐
   │  User clicks on service                  │
   │  ↓                                       │
   │  Page shows service details              │
   │  ↓                                       │
   │  User clicks "Next"                      │
   └──────────────────────────────────────────┘

4. CUSTOMER SELECTS DATE & TIME (STEP 3)
   ┌──────────────────────────────────────────┐
   │  User selects date                       │
   │  ↓                                       │
   │  User selects time                       │
   │  ↓                                       │
   │  User selects location type              │
   │  ↓                                       │
   │  User clicks "Next"                      │
   └──────────────────────────────────────────┘

5. CUSTOMER REVIEWS & CONFIRMS (STEP 4)
   ┌──────────────────────────────────────────┐
   │  Page shows booking summary              │
   │  ↓                                       │
   │  User can add notes                      │
   │  ↓                                       │
   │  User clicks "Confirm Booking"           │
   │  ↓                                       │
   │  Page calls createBooking()              │
   │  ↓                                       │
   │  Booking inserted into database          │
   │  ↓                                       │
   │  Page redirects to /booking/{id}         │
   └──────────────────────────────────────────┘

6. PAYMENT PROCESSING
   ┌──────────────────────────────────────────┐
   │  GET /booking/{id}                       │
   │  ↓                                       │
   │  Page calls GET /api/bookings/{id}       │
   │  ↓                                       │
   │  API returns booking details             │
   │  ↓                                       │
   │  Page displays Stripe payment form       │
   │  ↓                                       │
   │  User enters card details                │
   │  ↓                                       │
   │  User clicks "Pay"                       │
   │  ↓                                       │
   │  Page calls POST /api/stripe/...         │
   │  ↓                                       │
   │  API creates payment intent              │
   │  ↓                                       │
   │  Page confirms payment with Stripe       │
   │  ↓                                       │
   │  Stripe processes payment                │
   │  ↓                                       │
   │  Stripe sends webhook                    │
   │  ↓                                       │
   │  Webhook updates booking status          │
   │  ↓                                       │
   │  Page shows success message              │
   └──────────────────────────────────────────┘

7. BRAIDER RECEIVES BOOKING
   ┌──────────────────────────────────────────┐
   │  Real-time subscription triggers         │
   │  ↓                                       │
   │  Braider bookings page updates           │
   │  ↓                                       │
   │  Braider sees new booking                │
   │  ↓                                       │
   │  Braider can confirm/decline             │
   │  ↓                                       │
   │  Braider can mark complete               │
   └──────────────────────────────────────────┘
```

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         API ROUTES                              │
└─────────────────────────────────────────────────────────────────┘

BRAIDER LOADING
┌──────────────────────────────────────────┐
│  GET /api/braiders                       │
│  ↓                                       │
│  Service Supabase client                 │
│  ↓                                       │
│  Query braider_profiles table            │
│  ↓                                       │
│  Return braiders array                   │
└──────────────────────────────────────────┘

SERVICE LOADING
┌──────────────────────────────────────────┐
│  GET /api/services?braider_ids=...       │
│  ↓                                       │
│  Service Supabase client                 │
│  ↓                                       │
│  Query services table                    │
│  ↓                                       │
│  Filter by braider_ids                   │
│  ↓                                       │
│  Return services array                   │
└──────────────────────────────────────────┘

BOOKING DETAIL LOADING
┌──────────────────────────────────────────┐
│  GET /api/bookings/[id]                  │
│  ↓                                       │
│  Service Supabase client                 │
│  ↓                                       │
│  Query bookings table                    │
│  ↓                                       │
│  Filter by booking ID                    │
│  ↓                                       │
│  Return booking object                   │
└──────────────────────────────────────────┘

PAYMENT INTENT CREATION
┌──────────────────────────────────────────┐
│  POST /api/stripe/create-payment-intent  │
│  ↓                                       │
│  Validate booking exists                 │
│  ↓                                       │
│  Create Stripe payment intent            │
│  ↓                                       │
│  Return client secret                    │
└──────────────────────────────────────────┘

PAYMENT WEBHOOK
┌──────────────────────────────────────────┐
│  POST /api/stripe/webhook                │
│  ↓                                       │
│  Verify webhook signature                │
│  ↓                                       │
│  Check payment status                    │
│  ↓                                       │
│  Update booking status                   │
│  ↓                                       │
│  Release escrow if needed                │
└──────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

BRAIDER PROFILES TABLE
┌──────────────────────────────────────────┐
│  id                                      │
│  user_id                                 │
│  full_name                               │
│  avatar_url                              │
│  bio                                     │
│  rating_avg                              │
│  rating_count                            │
│  travel_radius_miles                     │
│  is_mobile                               │
│  salon_address                           │
│  verification_status                     │
└──────────────────────────────────────────┘
         ↓
    API /api/braiders
         ↓
    Booking Page (Step 1)

SERVICES TABLE
┌──────────────────────────────────────────┐
│  id                                      │
│  braider_id                              │
│  name                                    │
│  description                             │
│  duration_minutes                        │
│  price                                   │
│  created_at                              │
└──────────────────────────────────────────┘
         ↓
    API /api/services
         ↓
    Booking Page (Step 2)

BOOKINGS TABLE
┌──────────────────────────────────────────┐
│  id                                      │
│  customer_id                             │
│  customer_name                           │
│  braider_id                              │
│  braider_name                            │
│  service_id                              │
│  service_name                            │
│  service_price                           │
│  appointment_date                        │
│  location_address                        │
│  notes                                   │
│  status                                  │
│  total_amount                            │
│  platform_fee                            │
│  braider_payout                          │
│  escrow_released                         │
│  stripe_payment_intent_id                │
│  stripe_charge_id                        │
│  created_at                              │
│  updated_at                              │
└──────────────────────────────────────────┘
         ↓
    API /api/bookings/[id]
         ↓
    Booking Detail Page
         ↓
    Stripe Payment
         ↓
    Webhook Update
         ↓
    Braider Bookings Page (Real-time)
```

## Real-Time Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   REAL-TIME UPDATES                             │
└─────────────────────────────────────────────────────────────────┘

BOOKING CREATED
┌──────────────────────────────────────────┐
│  Customer confirms booking                │
│  ↓                                       │
│  Booking inserted into database          │
│  ↓                                       │
│  Real-time subscription triggers         │
│  ↓                                       │
│  Braider bookings page updates           │
│  ↓                                       │
│  Braider sees new booking                │
└──────────────────────────────────────────┘

BOOKING STATUS UPDATED
┌──────────────────────────────────────────┐
│  Braider confirms booking                 │
│  ↓                                       │
│  Booking status updated to "confirmed"   │
│  ↓                                       │
│  Real-time subscription triggers         │
│  ↓                                       │
│  Customer booking page updates           │
│  ↓                                       │
│  Customer sees confirmation              │
└──────────────────────────────────────────┘

PAYMENT COMPLETED
┌──────────────────────────────────────────┐
│  Stripe webhook received                  │
│  ↓                                       │
│  Booking status updated to "confirmed"   │
│  ↓                                       │
│  Real-time subscription triggers         │
│  ↓                                       │
│  Booking detail page updates             │
│  ↓                                       │
│  Customer sees payment success           │
└──────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING                                │
└─────────────────────────────────────────────────────────────────┘

API ERROR
┌──────────────────────────────────────────┐
│  API call fails                          │
│  ↓                                       │
│  Error caught in try/catch               │
│  ↓                                       │
│  Error logged to console                 │
│  ↓                                       │
│  User sees error message                 │
│  ↓                                       │
│  User can retry                          │
└──────────────────────────────────────────┘

PAYMENT ERROR
┌──────────────────────────────────────────┐
│  Payment fails                           │
│  ↓                                       │
│  Stripe returns error                    │
│  ↓                                       │
│  Error displayed to user                 │
│  ↓                                       │
│  User can retry with different card      │
└──────────────────────────────────────────┘

BOOKING ERROR
┌──────────────────────────────────────────┐
│  Booking creation fails                  │
│  ↓                                       │
│  Error caught in try/catch               │
│  ↓                                       │
│  User sees error message                 │
│  ↓                                       │
│  User can retry                          │
└──────────────────────────────────────────┘
```

## Summary

The booking system now has:
- ✅ Clear data flow from database to UI
- ✅ Reliable API routes with error handling
- ✅ Real-time updates via Supabase subscriptions
- ✅ Secure payment processing via Stripe
- ✅ Proper error handling at each step
- ✅ Professional UI/UX throughout

Users can now easily and reliably book braiders with real-time updates.
