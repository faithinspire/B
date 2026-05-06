# Permanent Fix Plan - Complete System Overhaul

## Critical Issues & Root Causes

### Issue 1: Braider Showing Customer Dashboard
**Root Cause:** Role defaults to 'customer' if profile fetch fails during login
**Location:** `store/supabaseAuthStore.ts` line 231
**Fix:** Ensure role is ALWAYS set in profiles table during signup, add retry logic

### Issue 2: Braider Profile "Not Found"
**Root Cause:** Two conflicting pages - `/braider-profile/[id]` searches store, `/braider/[id]` queries DB
**Location:** `app/(public)/braider-profile/[id]/page.tsx` vs `app/(public)/braider/[id]/page.tsx`
**Fix:** Remove store-based page, use database query only

### Issue 3: Messages Not Working
**Root Cause:** Multiple message stores and implementations causing conflicts
**Location:** `store/supabaseMessageStore.ts` vs `store/messageStore.ts`
**Fix:** Consolidate to single message store, ensure real-time subscriptions work

### Issue 4: Stripe Not Integrated
**Root Cause:** Stripe webhook exists but not connected to booking/payment flow
**Location:** `app/api/stripe/webhook/route.ts` exists but not used
**Fix:** Integrate Stripe into booking flow, ensure payment intents created

### Issue 5: Maps Not Integrated
**Root Cause:** RealtimeMap component exists but not used in any pages
**Location:** `app/components/RealtimeMap.tsx` not imported anywhere
**Fix:** Integrate maps into braider/customer pages for location tracking

---

## Implementation Plan

### Phase 1: Fix Auth Role Conflict (CRITICAL)
1. Update `app/api/auth/signup/route.ts` to ensure role is set in profiles table
2. Update `store/supabaseAuthStore.ts` to have better retry logic
3. Add explicit role check in Navigation component

### Phase 2: Fix Braider Profile Page (CRITICAL)
1. Delete `/braider-profile/[id]/page.tsx` (store-based, unreliable)
2. Keep `/braider/[id]/page.tsx` (database-based, reliable)
3. Update homepage links to use `/braider/[id]` instead

### Phase 3: Consolidate Message System
1. Keep `supabaseMessageStore.ts` as primary
2. Remove `messageStore.ts` (legacy)
3. Update both braider and customer message pages to use same store
4. Ensure real-time subscriptions work

### Phase 4: Integrate Stripe Payment System
1. Create booking flow that creates Stripe payment intent
2. Connect webhook to update booking status
3. Add payment UI to booking pages
4. Ensure braider receives payment notifications

### Phase 5: Integrate Maps System
1. Add RealtimeMap to braider dashboard (show customer location)
2. Add RealtimeMap to customer booking page (show braider location)
3. Add location tracking API calls
4. Ensure real-time location updates

---

## Files to Modify

### Auth & Role (Phase 1)
- `app/api/auth/signup/route.ts` - Ensure role in profiles table
- `store/supabaseAuthStore.ts` - Better retry logic
- `app/components/Navigation.tsx` - Explicit role check

### Braider Profile (Phase 2)
- DELETE: `app/(public)/braider-profile/[id]/page.tsx`
- KEEP: `app/(public)/braider/[id]/page.tsx`
- UPDATE: `app/(public)/page.tsx` - Use correct link

### Messages (Phase 3)
- DELETE: `store/messageStore.ts`
- KEEP: `store/supabaseMessageStore.ts`
- UPDATE: `app/(braider)/braider/messages/page.tsx`
- UPDATE: `app/(customer)/messages/page.tsx`

### Stripe (Phase 4)
- CREATE: `app/api/bookings/create/route.ts` - Create booking with payment intent
- UPDATE: `app/api/stripe/webhook/route.ts` - Already exists, ensure it works
- UPDATE: `app/(customer)/booking/page.tsx` - Add payment UI

### Maps (Phase 5)
- UPDATE: `app/(braider)/braider/dashboard/page.tsx` - Add map
- UPDATE: `app/(customer)/booking/[id]/page.tsx` - Add map
- UPDATE: `app/api/location/update/route.ts` - Ensure it works

---

## Expected Results

After all phases:
✅ Braiders see braider dashboard (not customer)
✅ Braider profile page works (not "not found")
✅ Messages work in real-time
✅ Stripe payments integrated
✅ Maps show locations for all users
✅ No conflicting code
✅ Clean, maintainable codebase

---

## Execution Order

1. Phase 1 (Auth) - MOST CRITICAL
2. Phase 2 (Braider Profile) - CRITICAL
3. Phase 3 (Messages) - IMPORTANT
4. Phase 4 (Stripe) - IMPORTANT
5. Phase 5 (Maps) - NICE TO HAVE

---

## Testing After Each Phase

Phase 1: Sign up as braider → should see braider dashboard
Phase 2: Click "View Profile" on homepage → should show braider profile
Phase 3: Send message → should receive in real-time
Phase 4: Book service → should create payment intent
Phase 5: During booking → should see map with locations
