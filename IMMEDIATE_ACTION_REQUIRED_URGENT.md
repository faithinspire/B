# 🚨 IMMEDIATE ACTION REQUIRED - URGENT FIXES

## Status: IN PROGRESS - CRITICAL ISSUES

You have reported 6 critical issues that are blocking users. Here's what needs to be done IMMEDIATELY:

---

## STEP 1: RUN DATABASE MIGRATION (DO THIS FIRST)

### In Supabase Dashboard:
1. Go to SQL Editor
2. Copy and paste the content from: `supabase/migrations/fix_marketplace_schema_and_features.sql`
3. Click "Run"
4. Wait for success message

**This will:**
- ✅ Add `braider_id` column to marketplace_orders (fixes the schema cache error)
- ✅ Create braider_status table (for 24-hour stories)
- ✅ Create followers table (for following system)
- ✅ Add payment_method and seller_country columns

---

## STEP 2: CRITICAL FIXES NEEDED IN CODE

### Issue #1: View Profile Broken
**File**: `app/(public)/braider/[id]/page.tsx`
**Problem**: Profile loads and refreshes without showing
**Fix**: Already using `<a>` tags, but need to ensure:
- Profile page has `export const dynamic = 'force-dynamic'`
- API fetches fresh data every time
- Error handling for missing profiles

### Issue #2: Barber Showing for All Braiders
**File**: `app/hooks/useBraiders.ts`
**Problem**: profession_type not properly set
**Fix**: Already fixed in previous session, but verify:
- profession_type is normalized correctly
- Barbers have profession_type = 'barber'
- Braiders have profession_type = 'braider'

### Issue #3: Chat/Messaging Broken
**File**: `app/(customer)/messages/[booking_id]/page.tsx`
**Problem**: No input field visible
**Fix**: Already enhanced, but verify:
- Message input form has white background
- Input field is visible and focused
- Send button works

### Issue #4: Marketplace Payment Flow
**Need to create**: `app/api/marketplace/orders/payment/route.ts`
**Logic**:
```typescript
// If seller_country === 'NG' → Use Paystack
// If seller_country === 'US' → Use Stripe
// Payment happens AFTER order confirmation
// Buyer pays on arrival (for Nigeria transfer)
```

### Issue #5: Braider Status (24-hour Stories)
**Need to create**: `app/api/braider/status/route.ts`
**Features**:
- Upload image/video
- Max 3 per braider
- Auto-delete after 24 hours
- Track views

### Issue #6: Following System
**Need to create**: `app/api/followers/route.ts`
**Features**:
- Follow/unfollow braiders
- View follower's status
- Display on homepage

---

## STEP 3: QUICK VERIFICATION CHECKLIST

After running the migration, verify in Supabase:

```sql
-- Check if braider_id column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'marketplace_orders' AND column_name = 'braider_id';

-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('braider_status', 'followers', 'status_views');
```

---

## STEP 4: DEPLOYMENT

After all fixes are done:
```bash
git add -A
git commit -m "Fix urgent issues: marketplace schema, messaging, payment flow, status/stories, following"
git push origin master
# Vercel will auto-deploy
```

---

## PRIORITY ORDER

1. **CRITICAL** (Do First):
   - Run database migration
   - Fix View Profile page
   - Fix message input visibility
   - Fix profession_type display

2. **HIGH** (Do Second):
   - Implement marketplace payment flow
   - Add Paystack integration for Nigeria
   - Add payment method selection

3. **MEDIUM** (Do Third):
   - Implement braider status/stories
   - Implement following system
   - Add status display to homepage

---

## WHAT'S ALREADY DONE

✅ Database migration file created
✅ Documentation created
✅ Previous 6 bugs fixed (profession_type, View Profile, booking auth, message input, navigation scroll, messaging)
✅ Committed to git
✅ Pushed to master

---

## WHAT NEEDS TO BE DONE NOW

1. **Run the SQL migration in Supabase** (5 minutes)
2. **Create API routes** (30 minutes):
   - Marketplace payment API
   - Braider status API
   - Followers API
3. **Update frontend components** (45 minutes):
   - Status upload component
   - Status display component
   - Follow/unfollow buttons
   - Payment selection UI
4. **Test everything** (30 minutes)
5. **Deploy** (5 minutes)

---

## ESTIMATED TIME: 2-3 HOURS

---

## NEXT IMMEDIATE STEPS

1. ✅ Run the SQL migration in Supabase
2. ⏳ Wait for confirmation that migration succeeded
3. ⏳ Create the API routes
4. ⏳ Update frontend components
5. ⏳ Test and deploy

**Once you confirm the migration is done, I'll create all the API routes and frontend components.**

---

## IMPORTANT NOTES

- The migration file is already created and committed
- All previous fixes are still in place
- The new features (status/stories, following) are optional but requested
- Payment flow is critical for marketplace to work

---

**Status**: Ready to proceed with API routes and frontend components once migration is confirmed.
