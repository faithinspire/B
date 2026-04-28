# 🚨 CRITICAL FIXES - SESSION CURRENT

## 4 PRODUCTION ISSUES + PASSWORD RESET FIX

### Issues to Fix:
1. ✅ **USA Braider Users Showing Paystack Instead of Stripe** - CRITICAL
2. ✅ **Chat Not Working Between Buyer and Seller** - CRITICAL  
3. ✅ **Marketplace Showing "Empty" Instead of Products** - CRITICAL
4. ✅ **Status Not Showing on Braider/Barber Pages** - HIGH
5. ✅ **Password Reset Email** - Use Supabase (not Resend)

---

## ISSUE 1: USA BRAIDER USERS SHOWING PAYSTACK INSTEAD OF STRIPE

### Root Cause
Payment provider selection in `app/(customer)/booking/[id]/page.tsx` checks `booking.braider_country`, `booking.currency`, `booking.country` but these fields aren't properly populated from the database.

### Fix
1. Update booking creation to include braider country
2. Fix payment provider selection logic
3. Add fallback to check braider profile country

### Files to Fix
- `app/(customer)/booking/[id]/page.tsx` - Payment provider selection
- `app/api/bookings/route.ts` - Ensure country is captured
- `app/api/paystack/initialize/route.ts` - Only for NG
- `app/api/stripe/create-payment-intent/route.ts` - Only for USA

---

## ISSUE 2: CHAT NOT WORKING BETWEEN BUYER AND SELLER

### Root Cause
Database schema mismatch:
- `conversations` table: customer_id/braider_id vs participant1_id/participant2_id
- `messages` table: `read` vs `is_read` column inconsistency
- Fallback logic masks real problems

### Fix
1. Verify conversations table schema
2. Verify messages table schema
3. Fix API endpoints to handle schema properly
4. Add proper error logging

### Files to Fix
- `app/api/conversations/route.ts` - Schema detection
- `app/api/messages/send/route.ts` - Message insertion
- `app/api/messages/conversation/[id]/route.ts` - Message fetching
- `app/(customer)/messages/[booking_id]/page.tsx` - Message display

---

## ISSUE 3: MARKETPLACE SHOWING "EMPTY" INSTEAD OF PRODUCTS

### Root Cause
Products not being fetched or created:
- API returns empty array on error
- Frontend doesn't show demo products as fallback
- marketplace_products table may be empty

### Fix
1. Verify marketplace_products table has data
2. Check product creation is working
3. Add demo products fallback
4. Add better error logging

### Files to Fix
- `app/api/marketplace/products/route.ts` - Product fetching
- `app/(public)/marketplace/page.tsx` - Empty state handling
- Database: Verify marketplace_products table

---

## ISSUE 4: STATUS NOT SHOWING ON BRAIDER/BARBER PAGES

### Root Cause
Status feature not being used:
- braider_status table may be empty
- Statuses expire after 24 hours
- No "Create Status" button on dashboard
- Homepage filters out braiders without statuses

### Fix
1. Verify braider_status table exists
2. Add "Create Status" button to dashboard
3. Show placeholder when no statuses
4. Add status creation endpoint

### Files to Fix
- `app/api/braider/status/route.ts` - Status fetching
- `app/components/BraiderStatus.tsx` - Status display
- `app/(braider)/braider/status/page.tsx` - Status creation
- `app/(public)/page.tsx` - Homepage status section

---

## ISSUE 5: PASSWORD RESET EMAIL - USE SUPABASE

### Current Issue
Previous implementation used Resend (third-party service)

### Fix
Use Supabase's native email service:
1. Update forgot-password endpoint to use Supabase
2. Use Supabase's resetPasswordForEmail() method
3. Keep token-based verification system
4. Remove Resend dependency

### Files to Fix
- `app/api/auth/forgot-password/route.ts` - Use Supabase email
- Keep token verification system
- Remove Resend references

---

## IMPLEMENTATION ORDER

1. **Password Reset** - Switch to Supabase (quick fix)
2. **Payment Provider** - Fix USA/Paystack issue (critical for revenue)
3. **Chat System** - Fix messaging (critical for user engagement)
4. **Marketplace** - Fix empty products (critical for marketplace)
5. **Status Feature** - Add missing functionality (nice to have)

---

## ESTIMATED TIME

- Password Reset: 10 minutes
- Payment Provider: 15 minutes
- Chat System: 20 minutes
- Marketplace: 15 minutes
- Status Feature: 15 minutes

**Total: ~75 minutes**

---

## STATUS

Starting implementation now...
