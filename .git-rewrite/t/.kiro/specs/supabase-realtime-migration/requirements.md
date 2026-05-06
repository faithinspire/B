# Supabase Real-Time Migration Requirements

## Overview
Migrate the entire app from local storage + local authentication to Supabase for real-time synchronization across browsers, devices, and users.

## Current State
- **Authentication**: Local storage based (lib/localAuth.ts)
- **Data Storage**: 4 Zustand stores with persist middleware
- **Synchronization**: None (local only)
- **Payment**: Stripe integration exists but not fully functional
- **Real-time**: No real-time features

## Target State
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Synchronization**: Real-time across all browsers and devices
- **Payment**: Fully integrated Stripe with webhooks
- **Real-time**: Supabase Realtime for messages, bookings, notifications

## Key Requirements

### 1. Authentication Migration
- Replace local auth with Supabase Auth
- Migrate existing users to Supabase
- Implement email verification
- Support password reset
- Maintain session across tabs/windows

### 2. Database Schema
- Create/update Supabase tables matching existing data
- Migrate all local data to Supabase
- Set up proper indexes and constraints
- Enable Row Level Security (RLS)

### 3. Real-Time Features
- Braider profiles sync across browsers
- Bookings update in real-time
- Messages sync instantly
- Notifications push to all devices
- Favorites sync across devices

### 4. Payment Integration
- Stripe Connect for braider payouts
- Payment intent creation
- Webhook handling for payment events
- Escrow management
- Payout processing

### 5. Image Storage
- Migrate base64 images to Supabase Storage
- Implement proper image upload/download
- Set up CDN for image delivery
- Clean up old base64 data

### 6. Data Migration
- Export all local storage data
- Transform to Supabase schema
- Validate data integrity
- Handle duplicates and conflicts

## Implementation Phases

### Phase 1: Authentication (Priority: Critical)
- Set up Supabase Auth
- Create auth store using Supabase
- Migrate users
- Test login/signup

### Phase 2: Database & Profiles (Priority: Critical)
- Create Supabase tables
- Migrate braider profiles
- Migrate user profiles
- Set up RLS policies

### Phase 3: Real-Time Sync (Priority: High)
- Implement Supabase subscriptions
- Update braider store
- Update booking store
- Update message store

### Phase 4: Payment Integration (Priority: High)
- Set up Stripe Connect
- Create payment endpoints
- Implement webhooks
- Test payment flow

### Phase 5: Image Storage (Priority: Medium)
- Set up Supabase Storage
- Migrate images
- Update image references
- Clean up base64 data

### Phase 6: Testing & Deployment (Priority: High)
- Cross-browser testing
- Real-time sync testing
- Payment testing
- Performance testing

## Success Criteria
- ✅ Users can sign up/login with Supabase
- ✅ Braider profiles visible across browsers immediately
- ✅ Bookings sync in real-time
- ✅ Messages sync instantly
- ✅ Payments process successfully
- ✅ No local storage dependencies
- ✅ App works offline gracefully
- ✅ All data persists in Supabase
