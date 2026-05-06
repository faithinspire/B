# App Structure Overview

## Directory Structure

```
app/
├── (admin)/
│   └── admin/
│       ├── page.tsx (Dashboard)
│       ├── users/page.tsx
│       ├── verification/page.tsx
│       ├── disputes/page.tsx
│       └── financials/page.tsx
│
├── (braider)/
│   └── braider/
│       ├── dashboard/page.tsx ✅ (Shows portfolio, services, earnings)
│       ├── portfolio/page.tsx ✅ (Add/delete portfolio items)
│       ├── services/page.tsx ✅ (Add/remove services)
│       ├── calendar/page.tsx ✅ (Accept/decline bookings)
│       ├── wallet/page.tsx ✅ (Request payouts)
│       └── verify/page.tsx (Identity verification)
│
├── (customer)/
│   ├── dashboard/page.tsx ✅ (Browse + My Bookings tabs)
│   ├── booking/page.tsx ✅ (4-step booking wizard)
│   ├── booking/[id]/page.tsx (Booking details)
│   ├── profile/page.tsx (Customer profile)
│   ├── favorites/page.tsx (Saved braiders)
│   ├── notifications/page.tsx (Notifications)
│   └── referrals/page.tsx (Referral program)
│
├── (public)/
│   ├── page.tsx (Landing page)
│   ├── login/page.tsx (Login)
│   ├── signup/page.tsx (Signup selector)
│   ├── signup/admin/page.tsx (Admin signup)
│   ├── signup/braider/page.tsx (Braider signup)
│   ├── signup/customer/page.tsx (Customer signup)
│   ├── search/page.tsx (Search braiders)
│   ├── braider/[id]/page.tsx (Braider profile)
│   ├── braider-profile/[id]/page.tsx (Braider details)
│   ├── privacy/page.tsx (Privacy policy)
│   └── terms/page.tsx (Terms of service)
│
├── api/
│   ├── stripe/
│   │   ├── create-payment-intent/route.ts
│   │   └── webhook/route.ts
│   └── twilio/
│       ├── send-otp/route.ts
│       └── verify-otp/route.ts
│
├── components/
│   ├── Navigation.tsx (Top navbar)
│   └── BottomNav.tsx ✅ (Mobile bottom nav)
│
├── layout.tsx ✅ (Root layout with BottomNav)
├── globals.css (Global styles & animations)
└── AuthInitializer.tsx (Session initialization)

lib/
├── localAuth.ts (Local authentication)
├── supabase.ts (Supabase config)
├── stripe.ts (Stripe config)
├── utils.ts (Utility functions)
└── validations.ts (Form validations)

store/
├── authStore.ts (Auth state)
├── braiderProfileStore.ts ✅ (Braider profile management)
├── braiderStore.ts (Legacy - being phased out)
└── bookingStore.ts (Booking state)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Customer Signs Up                                        │
│     └─> authStore (localStorage)                            │
│                                                               │
│  2. Customer Browses Dashboard                              │
│     └─> useBraiderProfileStore.profiles (Map)              │
│         └─> Displays all braiders                           │
│                                                               │
│  3. Customer Books Braider                                  │
│     └─> 4-Step Wizard                                       │
│         ├─> Select Braider                                  │
│         ├─> Select Service                                  │
│         ├─> Select Date/Time                                │
│         └─> Confirm Booking                                 │
│             └─> Save to:                                    │
│                 ├─> my_bookings_${customer.id}              │
│                 └─> bookings_${braider.user_id}             │
│                                                               │
│  4. Customer Views My Bookings                              │
│     └─> Load from my_bookings_${customer.id}               │
│         └─> Display with status                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BRAIDER FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Braider Signs Up                                        │
│     └─> authStore (localStorage)                            │
│     └─> useBraiderProfileStore.createProfile()             │
│                                                               │
│  2. Braider Adds Portfolio                                  │
│     └─> useBraiderProfileStore.addPortfolioItem()          │
│         └─> Save to profiles Map                            │
│         └─> Persist to localStorage                         │
│                                                               │
│  3. Braider Adds Services                                   │
│     └─> useBraiderProfileStore.addService()                │
│         └─> Save to profiles Map                            │
│         └─> Persist to localStorage                         │
│                                                               │
│  4. Braider Views Calendar                                  │
│     └─> Load from bookings_${braider.user_id}              │
│         └─> Display pending bookings                        │
│                                                               │
│  5. Braider Accepts/Declines Booking                        │
│     └─> Update booking status                               │
│         └─> Persist to localStorage                         │
│                                                               │
│  6. Braider Requests Payout                                 │
│     └─> useBraiderProfileStore.requestPayout()             │
│         ├─> Deduct from available_balance                   │
│         ├─> Save transaction                                │
│         └─> Persist to localStorage                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## State Management

```
authStore (Zustand + localStorage)
├── user: User | null
├── isAuthenticated: boolean
├── login(email, password)
├── signup(email, password, role, data)
├── logout()
└── initializeAuth()

useBraiderProfileStore (Zustand + localStorage)
├── profiles: Map<string, BraiderProfile>
├── currentProfile: BraiderProfile | null
├── createProfile(userId, data)
├── updateProfile(userId, data)
├── addPortfolioItem(userId, item)
├── removePortfolioItem(userId, itemId)
├── addService(userId, service)
├── removeService(userId, serviceId)
├── addEarnings(userId, amount)
├── requestPayout(userId, amount, bankAccount)
└── getBalance(userId)

useBookingStore (Zustand + localStorage)
├── serviceId: string | null
├── appointmentDate: string | null
├── locationAddress: string | null
├── notes: string | null
└── reset()
```

## localStorage Structure

```
localStorage:
├── auth_user: User object
├── auth_token: JWT token
├── braider-profile-store: BraiderProfile Map
├── braider-store: Legacy braider data
├── booking-store: Booking state
├── favorites_${customer.id}: string[] (braider IDs)
├── my_bookings_${customer.id}: Booking[]
├── bookings_${braider.user_id}: Booking[]
└── transactions_${braider.user_id}: Transaction[]
```

## Component Hierarchy

```
RootLayout
├── AuthInitializer
├── Navigation (Top navbar)
├── Children (Page content)
└── BottomNav (Mobile only)
    ├── Home link
    ├── Browse link
    ├── Favorites link (customer only)
    └── Profile link
```

## Page Routing

```
Public Routes:
├── / (Landing page)
├── /login
├── /signup
├── /signup/admin
├── /signup/braider
├── /signup/customer
├── /search
├── /braider/[id]
├── /braider-profile/[id]
├── /privacy
└── /terms

Protected Routes (Customer):
├── /dashboard
├── /booking
├── /booking/[id]
├── /profile
├── /favorites
├── /notifications
└── /referrals

Protected Routes (Braider):
├── /braider/dashboard
├── /braider/portfolio
├── /braider/services
├── /braider/calendar
├── /braider/wallet
└── /braider/verify

Protected Routes (Admin):
├── /admin
├── /admin/users
├── /admin/verification
├── /admin/disputes
└── /admin/financials
```

## API Routes

```
POST /api/stripe/create-payment-intent
- Create Stripe payment intent
- Body: { amount, currency, customer_id }
- Returns: { clientSecret }

POST /api/stripe/webhook
- Handle Stripe webhooks
- Validates webhook signature
- Updates payment status

POST /api/twilio/send-otp
- Send OTP via SMS
- Body: { phone_number }
- Returns: { success, message }

POST /api/twilio/verify-otp
- Verify OTP code
- Body: { phone_number, code }
- Returns: { success, verified }
```

## Key Features by Page

### Braider Dashboard
- Portfolio count
- Services count
- Available balance
- Total earnings
- Rating
- Quick action cards
- Profile information

### Braider Portfolio
- Add portfolio items
- Delete portfolio items
- Image URL support
- Real-time updates
- Error handling

### Braider Services
- Add services
- Remove services
- Price & duration
- Description
- Real-time updates
- Error handling

### Braider Calendar
- Monthly calendar view
- Upcoming bookings list
- Accept/decline bookings
- Status tracking
- Booking details

### Braider Wallet
- Available balance
- Total earnings
- Total payouts
- Request payout form
- Transaction history
- Real-time updates

### Customer Dashboard
- Browse Braiders tab
  - Search by name/specialty
  - Filter by rating
  - Filter by price
  - Add to favorites
  - View profile button
  - Quick book button
- My Bookings tab
  - View all bookings
  - Booking status
  - Booking details

### Customer Booking
- Step 1: Select braider
- Step 2: Select service
- Step 3: Select date/time/location
- Step 4: Review & confirm
- Real-time validation
- Error handling

## Responsive Breakpoints

```
Mobile: 375px - 767px
├── Bottom nav visible
├── Single column layout
├── Touch-friendly buttons (44px)
└── Optimized spacing

Tablet: 768px - 1023px
├── Bottom nav hidden
├── 2-column layout
├── Optimized spacing
└── Medium buttons

Desktop: 1024px+
├── Bottom nav hidden
├── 3+ column layout
├── Full layout
└── Standard buttons
```

## Animation Classes

```
fadeIn - Fade in animation
slideUp - Slide up animation
slideDown - Slide down animation
scaleIn - Scale in animation
bounce - Bounce animation
glow - Glow effect
animate-delay-100 - 100ms delay
animate-delay-200 - 200ms delay
animate-delay-300 - 300ms delay
```

## Color Scheme

```
Primary: #9333ea (Purple)
Secondary: #ec4899 (Pink)
Accent: #f59e0b (Amber)
Success: #10b981 (Green)
Error: #ef4444 (Red)
Warning: #f59e0b (Amber)
```

This structure ensures scalability, maintainability, and real-time data synchronization across all pages.
