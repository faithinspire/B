# SYSTEM FLOW EXPLANATION

## How Everything Works Together

---

## FLOW 1: Homepage Featured Braiders Display

```
User visits http://localhost:3001
    ↓
LandingPage component loads (app/(public)/page.tsx)
    ↓
useBraiders hook is called
    ↓
Hook fetches from /api/braiders with no-cache headers
    ↓
API endpoint (app/api/braiders/route.ts) runs:
  - Creates service role Supabase client (bypasses RLS)
  - Queries braider_profiles table
  - Sorts by: is_premium DESC, featured_order DESC, rating_avg DESC
  - Returns all braiders with all fields
    ↓
Hook receives data and sets state
    ↓
Homepage useEffect filters and sorts braiders:
  - Filters out braiders without full_name or user_id
  - Sorts by rating_avg (highest first)
  - Takes top 12 braiders
    ↓
Featured Braiders section renders:
  - Shows carousel with 4 braiders per page
  - Auto-rotates every 5 seconds
  - Shows name, bio, rating, verification status
  - "View Profile" button links to /braider/{user_id}
    ↓
User sees braiders on homepage ✅
```

**Database Columns Needed**:
- `braider_profiles.is_premium` (BOOLEAN)
- `braider_profiles.featured_order` (INTEGER)
- `braider_profiles.latitude` (DECIMAL)
- `braider_profiles.longitude` (DECIMAL)

---

## FLOW 2: Admin Dashboard Access

```
User visits http://localhost:3001/admin/dashboard
    ↓
AdminDashboardPage component loads (app/(admin)/admin/dashboard/page.tsx)
    ↓
useSupabaseAuthStore hook is called
    ↓
Auth store initializeSession runs:
  - Gets current session from Supabase auth
  - Fetches user profile from profiles table (with 10 retries)
  - Gets role from profile.role (or auth metadata as fallback)
  - Sets user state with role
    ↓
AdminDashboardPage checks user.role:
  - If role !== 'admin': redirect to '/'
  - If role === 'admin': show dashboard
    ↓
Dashboard fetches stats from /api/admin/dashboard
    ↓
Dashboard renders with stats cards and navigation buttons
    ↓
User sees admin dashboard ✅
```

**Database Columns Needed**:
- `profiles.role` (must be 'admin' for damilola@gmail.com)

**Auth Store Logic**:
1. Fetch profile from database (10 retries with exponential backoff)
2. Get role from profile.role
3. If profile not found, use auth metadata role
4. Default to 'customer' if no role found

---

## FLOW 3: Admin Users Page with Phone

```
User visits http://localhost:3001/admin/users
    ↓
AdminUsersPage component loads (app/(admin)/admin/users/page.tsx)
    ↓
useEffect calls fetchUsers()
    ↓
fetchUsers() calls /api/admin/users with auth token
    ↓
API endpoint (app/api/admin/users/route.ts) runs:
  - Verifies auth token
  - Checks user is admin (from profiles.role)
  - Fetches all users from auth.admin.listUsers()
  - Fetches profiles for all users (joins on id)
  - Fetches braider_profiles for braiders (joins on user_id)
  - Maps users with all details including phone
  - Returns array of users
    ↓
Component receives data and sets state
    ↓
useEffect filters users based on search and role filter
    ↓
Table renders with columns:
  - Name (from profile.full_name)
  - Email (from auth.email)
  - Role (from profile.role)
  - Joined (from auth.created_at)
  - Phone (from profile.phone)
    ↓
User sees users table with phone numbers ✅
```

**Database Columns Needed**:
- `profiles.phone` (TEXT)

**API Response Structure**:
```json
[
  {
    "id": "user-id",
    "email": "user@example.com",
    "full_name": "User Name",
    "phone": "+1234567890",
    "role": "customer|braider|admin",
    "created_at": "2024-01-01T00:00:00Z",
    "avatar_url": "https://...",
    "bio": "User bio",
    "braiderProfile": { ... } // if braider
  }
]
```

---

## FLOW 4: Real-Time Updates

```
Braider profile is updated in database
    ↓
Supabase postgres_changes event fires
    ↓
useBraiders hook subscription receives event
    ↓
Debounced refetch (1 second delay)
    ↓
Hook calls fetchBraiders(true) with force=true
    ↓
API fetches fresh data from database
    ↓
Hook updates state with new braiders
    ↓
Homepage re-renders with updated braiders ✅
```

---

## FLOW 5: Authentication & Role Checking

```
User logs in with email/password
    ↓
Auth store signIn() runs:
  - Calls supabase.auth.signInWithPassword()
  - Fetches profile from profiles table (10 retries)
  - Gets role from profile.role
  - Sets user state with role
    ↓
User is now authenticated with role
    ↓
When user visits /admin/dashboard:
  - Dashboard checks user.role
  - If role === 'admin': show dashboard
  - If role !== 'admin': redirect to /
    ↓
User sees appropriate page ✅
```

**Role Hierarchy**:
- `admin`: Full access to admin dashboard
- `braider`: Access to braider dashboard
- `customer`: Access to customer dashboard

---

## DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  profiles table:                                              │
│  ├─ id (UUID)                                                │
│  ├─ email (TEXT)                                             │
│  ├─ full_name (TEXT)                                         │
│  ├─ role (TEXT) ← CRITICAL FOR ADMIN                        │
│  ├─ phone (TEXT) ← NEEDED FOR ADMIN USERS                   │
│  ├─ avatar_url (TEXT)                                        │
│  └─ bio (TEXT)                                               │
│                                                               │
│  braider_profiles table:                                      │
│  ├─ user_id (UUID)                                           │
│  ├─ full_name (TEXT)                                         │
│  ├─ email (TEXT)                                             │
│  ├─ is_premium (BOOLEAN) ← NEEDED FOR FEATURED              │
│  ├─ featured_order (INTEGER) ← NEEDED FOR FEATURED          │
│  ├─ latitude (DECIMAL) ← NEEDED FOR FEATURED                │
│  ├─ longitude (DECIMAL) ← NEEDED FOR FEATURED               │
│  ├─ rating_avg (DECIMAL)                                     │
│  ├─ verification_status (TEXT)                               │
│  └─ ... other fields                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
    API Calls                            API Calls
         │                                    │
┌────────┴────────────────────────────────────┴──────────────┐
│                  Next.js API Routes                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  /api/braiders                                               │
│  ├─ Fetches braider_profiles                                │
│  ├─ Sorts by is_premium, featured_order, rating_avg        │
│  └─ Returns all braiders                                    │
│                                                               │
│  /api/admin/users                                            │
│  ├─ Verifies admin role                                     │
│  ├─ Fetches users from auth                                 │
│  ├─ Joins with profiles (gets phone)                        │
│  └─ Returns users with phone field                          │
│                                                               │
│  /api/admin/dashboard                                        │
│  ├─ Verifies admin role                                     │
│  └─ Returns dashboard stats                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
    Fetch Calls                          Fetch Calls
         │                                    │
┌────────┴────────────────────────────────────┴──────────────┐
│              React Components                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  app/(public)/page.tsx (Homepage)                            │
│  ├─ useBraiders hook                                        │
│  ├─ Displays Featured Braiders carousel                     │
│  └─ Shows 12 top-rated braiders                             │
│                                                               │
│  app/(admin)/admin/dashboard/page.tsx                        │
│  ├─ useSupabaseAuthStore hook                               │
│  ├─ Checks user.role === 'admin'                            │
│  └─ Shows admin dashboard                                   │
│                                                               │
│  app/(admin)/admin/users/page.tsx                            │
│  ├─ Fetches users from /api/admin/users                     │
│  ├─ Displays users table                                    │
│  └─ Shows phone column                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## WHAT HAPPENS WHEN SQL IS RUN

### Before SQL Migration
```
braider_profiles table:
├─ user_id, full_name, email, rating_avg, verification_status, ...
└─ ❌ Missing: is_premium, featured_order, latitude, longitude

profiles table:
├─ id, email, full_name, role, avatar_url, bio, ...
└─ ❌ Missing: phone
```

### After SQL Migration
```
braider_profiles table:
├─ user_id, full_name, email, rating_avg, verification_status, ...
└─ ✅ Added: is_premium, featured_order, latitude, longitude

profiles table:
├─ id, email, full_name, role, avatar_url, bio, ...
└─ ✅ Added: phone
```

### After Admin Role Fix
```
profiles table (damilola@gmail.com):
├─ id: "user-id"
├─ email: "damilola@gmail.com"
├─ role: ✅ "admin" (was "customer" or missing)
└─ updated_at: NOW()
```

---

## RESULT

✅ Homepage Featured Braiders section displays braiders
✅ Admin dashboard accessible for damilola@gmail.com
✅ Admin users page displays phone numbers

All three issues fixed with just SQL migrations!

