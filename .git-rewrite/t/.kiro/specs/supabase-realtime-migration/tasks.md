# Supabase Real-Time Migration - Implementation Tasks

## Phase 1: Authentication Migration

### Task 1.1: Create Supabase Auth Store
- [ ] Create `store/supabaseAuthStore.ts`
- [ ] Implement sign up with Supabase Auth
- [ ] Implement sign in with Supabase Auth
- [ ] Implement sign out
- [ ] Implement password reset
- [ ] Implement session persistence
- [ ] Add real-time auth state listener

### Task 1.2: Update Auth Initializer
- [ ] Update `app/AuthInitializer.tsx` to use Supabase
- [ ] Initialize auth state on app load
- [ ] Handle auth state changes
- [ ] Redirect based on auth status

### Task 1.3: Migrate Existing Users
- [ ] Create migration script
- [ ] Export users from localStorage
- [ ] Create users in Supabase Auth
- [ ] Create user profiles in database
- [ ] Verify migration success

## Phase 2: Database & Profiles

### Task 2.1: Create Supabase Tables
- [ ] Create `profiles` table
- [ ] Create `braider_profiles` table
- [ ] Create `services` table
- [ ] Create `bookings` table
- [ ] Create `messages` table
- [ ] Create `conversations` table
- [ ] Create `reviews` table
- [ ] Create `disputes` table
- [ ] Create `notifications` table
- [ ] Create `favorites` table

### Task 2.2: Set Up Row Level Security
- [ ] Enable RLS on all tables
- [ ] Create policies for profiles
- [ ] Create policies for braider_profiles
- [ ] Create policies for bookings
- [ ] Create policies for messages
- [ ] Create policies for favorites

### Task 2.3: Migrate Profile Data
- [ ] Create `store/supabaseBraiderStore.ts`
- [ ] Migrate braider profiles from localStorage
- [ ] Migrate services
- [ ] Migrate portfolio items
- [ ] Verify data integrity

### Task 2.4: Migrate Booking Data
- [ ] Create `store/supabaseBookingStore.ts`
- [ ] Migrate bookings from localStorage
- [ ] Migrate booking status
- [ ] Verify booking data

## Phase 3: Real-Time Sync

### Task 3.1: Implement Real-Time Subscriptions
- [ ] Set up Supabase Realtime for braider profiles
- [ ] Set up Supabase Realtime for bookings
- [ ] Set up Supabase Realtime for messages
- [ ] Set up Supabase Realtime for notifications

### Task 3.2: Update Braider Store
- [ ] Replace Zustand persist with Supabase queries
- [ ] Add real-time subscription to braider profiles
- [ ] Implement auto-refresh on changes
- [ ] Handle connection errors

### Task 3.3: Update Booking Store
- [ ] Replace Zustand persist with Supabase queries
- [ ] Add real-time subscription to bookings
- [ ] Implement auto-refresh on changes
- [ ] Handle connection errors

### Task 3.4: Update Message Store
- [ ] Replace Zustand persist with Supabase queries
- [ ] Add real-time subscription to messages
- [ ] Implement auto-refresh on changes
- [ ] Handle connection errors

## Phase 4: Payment Integration

### Task 4.1: Set Up Stripe Connect
- [ ] Create Stripe Connect account
- [ ] Set up Stripe API keys
- [ ] Create `lib/stripe.ts` utility
- [ ] Implement account linking flow

### Task 4.2: Create Payment Endpoints
- [ ] Create `/api/stripe/create-payment-intent` endpoint
- [ ] Create `/api/stripe/confirm-payment` endpoint
- [ ] Create `/api/stripe/create-payout` endpoint
- [ ] Implement error handling

### Task 4.3: Implement Webhooks
- [ ] Create `/api/stripe/webhook` endpoint
- [ ] Handle `payment_intent.succeeded` event
- [ ] Handle `payment_intent.payment_failed` event
- [ ] Handle `charge.refunded` event
- [ ] Update booking status on payment events

### Task 4.4: Update Wallet Page
- [ ] Update `app/(braider)/braider/wallet/page.tsx`
- [ ] Fetch earnings from Supabase
- [ ] Implement payout request
- [ ] Show transaction history
- [ ] Real-time balance updates

## Phase 5: Image Storage

### Task 5.1: Set Up Supabase Storage
- [ ] Create storage bucket for avatars
- [ ] Create storage bucket for portfolio
- [ ] Set up public access policies
- [ ] Configure CORS

### Task 5.2: Migrate Images
- [ ] Create migration script for base64 images
- [ ] Upload images to Supabase Storage
- [ ] Update image URLs in database
- [ ] Verify all images accessible

### Task 5.3: Update Image Upload
- [ ] Update `lib/imageUpload.ts`
- [ ] Implement Supabase Storage upload
- [ ] Remove base64 conversion
- [ ] Add progress tracking

## Phase 6: Testing & Deployment

### Task 6.1: Cross-Browser Testing
- [ ] Test signup in Chrome
- [ ] Test signup in Firefox
- [ ] Test signup in Safari
- [ ] Test real-time sync across browsers
- [ ] Test session persistence

### Task 6.2: Real-Time Testing
- [ ] Test braider profile sync
- [ ] Test booking updates
- [ ] Test message delivery
- [ ] Test notification delivery
- [ ] Test with multiple users

### Task 6.3: Payment Testing
- [ ] Test payment intent creation
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Test refund
- [ ] Test payout request

### Task 6.4: Performance Testing
- [ ] Test with 100+ braiders
- [ ] Test with 1000+ bookings
- [ ] Test with 10000+ messages
- [ ] Monitor database performance
- [ ] Optimize queries if needed

### Task 6.5: Deployment
- [ ] Update environment variables
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Verify all features working
- [ ] Clean up old localStorage data

## Rollback Plan
- Keep local storage data for 30 days
- Maintain backup of all data
- Document rollback procedure
- Test rollback before deployment
