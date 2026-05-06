# CRITICAL FIXES REQUIRED - Dashboard, Braiders, Bookings

## 🔴 3 Critical Issues Identified

### Issue 1: Customer Dashboard Showing as Admin Dashboard
**Problem**: Users see customer dashboard even when they should see admin dashboard
**Root Cause**: Role detection logic defaults to 'customer' when profile doesn't exist

**Fix**: Update role detection to check auth metadata first

### Issue 2: No Braiders on Homepage
**Problem**: Featured braiders carousel is empty
**Root Cause**: 
- braider_profiles table is empty or incomplete
- Braiders don't have full_name, email, user_id populated
- Homepage filters out incomplete braiders

**Fix**: Populate braider_profiles table with complete data

### Issue 3: No Braiders Available for Bookings
**Problem**: Can't find braiders to book
**Root Cause**:
- Services table is empty
- Braider profiles incomplete
- No services created for braiders

**Fix**: Create services for braiders

---

## 🚀 IMMEDIATE FIXES

### Fix 1: Populate braider_profiles Table

Run this SQL in Supabase:

```sql
-- Ensure all braiders have complete profiles
INSERT INTO public.braider_profiles (user_id, full_name, email, bio, verification_status, created_at, updated_at)
SELECT 
  p.id,
  p.full_name,
  p.email,
  'Professional braider' as bio,
  'unverified' as verification_status,
  NOW(),
  NOW()
FROM public.profiles p
WHERE p.role = 'braider'
AND NOT EXISTS (
  SELECT 1 FROM public.braider_profiles bp WHERE bp.user_id = p.id
)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Verify braiders were created
SELECT COUNT(*) as total_braiders FROM public.braider_profiles;
```

### Fix 2: Create Sample Services for Braiders

```sql
-- Create sample services for each braider
INSERT INTO public.services (braider_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at)
SELECT 
  bp.user_id,
  'Box Braids' as name,
  'Professional box braids' as description,
  'box_braids' as category,
  120 as duration_minutes,
  80.00 as price,
  true as is_active,
  NOW(),
  NOW()
FROM public.braider_profiles bp
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s WHERE s.braider_id = bp.user_id
)
ON CONFLICT DO NOTHING;

-- Verify services were created
SELECT COUNT(*) as total_services FROM public.services;
```

### Fix 3: Fix Role Detection in Auth Store

Update `store/supabaseAuthStore.ts`:

```typescript
// OLD CODE (WRONG):
const role = profile?.role || session.user.user_metadata?.role || 'customer';

// NEW CODE (CORRECT):
// Check auth metadata first, then profile
const role = session.user.user_metadata?.role || profile?.role || 'customer';
```

### Fix 4: Fix Dashboard Routing

Update `app/(admin)/admin/dashboard/page.tsx`:

```typescript
// Add proper role check
useEffect(() => {
  if (!authLoading && user) {
    // Check if user is admin
    if (user.role !== 'admin') {
      // Redirect to customer dashboard
      router.push('/customer/dashboard');
    }
  }
}, [user, authLoading, router]);
```

---

## 📋 Step-by-Step Implementation

### Step 1: Run SQL Scripts (5 minutes)

1. Open Supabase SQL Editor
2. Run Fix 1 SQL (populate braider_profiles)
3. Run Fix 2 SQL (create services)
4. Verify results

### Step 2: Update Code Files (10 minutes)

1. Update `store/supabaseAuthStore.ts` - Fix role detection
2. Update `app/(admin)/admin/dashboard/page.tsx` - Fix routing
3. Commit changes to Git

### Step 3: Test (10 minutes)

1. Login as admin - should see admin dashboard
2. Login as customer - should see customer dashboard
3. Login as braider - should see braider dashboard
4. Check homepage - should see braiders
5. Search for braiders - should find them
6. Try to book - should see services

---

## 🔧 Detailed Code Fixes

### Fix store/supabaseAuthStore.ts

Find this line (around line 60):
```typescript
const role = profile?.role || session.user.user_metadata?.role || 'customer';
```

Replace with:
```typescript
const role = session.user.user_metadata?.role || profile?.role || 'customer';
```

### Fix app/(admin)/admin/dashboard/page.tsx

Add this useEffect after line 30:
```typescript
useEffect(() => {
  if (!authLoading && user) {
    if (user.role !== 'admin') {
      router.push('/customer/dashboard');
    }
  }
}, [user, authLoading, router]);
```

---

## ✅ Verification Checklist

After implementing fixes:

- [ ] Run SQL scripts in Supabase
- [ ] Update store/supabaseAuthStore.ts
- [ ] Update app/(admin)/admin/dashboard/page.tsx
- [ ] Commit changes to Git
- [ ] Test admin login - see admin dashboard
- [ ] Test customer login - see customer dashboard
- [ ] Test braider login - see braider dashboard
- [ ] Check homepage - see braiders
- [ ] Search for braiders - find them
- [ ] Try to book - see services

---

## 📊 Expected Results After Fixes

### Homepage
- ✅ Featured braiders carousel displays
- ✅ Shows braider pictures
- ✅ Shows real names
- ✅ Shows ratings

### Search
- ✅ Can find braiders
- ✅ Can filter by style/price
- ✅ Can view braider profiles

### Booking
- ✅ Can see braider services
- ✅ Can select service
- ✅ Can book appointment
- ✅ Can make payment

### Dashboard
- ✅ Admin sees admin dashboard
- ✅ Customer sees customer dashboard
- ✅ Braider sees braider dashboard

---

## 🚀 Quick Action

1. **Run SQL scripts** (5 min)
2. **Update 2 code files** (10 min)
3. **Commit to Git** (2 min)
4. **Test** (10 min)

**Total time: 27 minutes**

---

## 📞 If Issues Persist

1. Check browser console for errors (F12)
2. Check Supabase logs
3. Verify SQL scripts ran successfully
4. Verify code changes were saved
5. Clear browser cache and reload

