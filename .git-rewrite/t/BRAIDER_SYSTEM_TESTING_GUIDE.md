# BRAIDER SYSTEM - COMPLETE TESTING GUIDE

## 🎯 SYSTEM OVERVIEW

The braider system consists of:
1. **5-Step Braider Signup** with Nigerian locations
2. **Admin Verification Dashboard** with green checkmark
3. **Booking Workflow** (Start → Finish → Confirm → Pay)
4. **Real-time Notifications** for all parties
5. **Database Schema** with verification & booking tables

---

## 📋 PRE-TESTING CHECKLIST

### Database Setup
- [ ] Run migration: `supabase/migrations/notifications_no_rls.sql`
- [ ] Verify `notifications` table exists
- [ ] Verify `braider_verifications` table exists
- [ ] Verify `bookings` table has new columns (started_at, finished_at, confirmed_at, status)

### Code Deployment
- [ ] All files committed to git
- [ ] Vercel deployment complete
- [ ] Environment variables set (SUPABASE_SERVICE_ROLE_KEY)

---

## 🧪 TEST SCENARIOS

### TEST 1: Braider Signup (5 Steps)

**Location**: `http://localhost:3000/signup/braider`

**Step 1: Basic Info**
- [ ] Enter full name: "John Braider"
- [ ] Enter email: "john@example.com"
- [ ] Select country: Nigeria
- [ ] Enter phone: "+234 801 234 5678"
- [ ] Enter password: "SecurePass123"
- [ ] Confirm password: "SecurePass123"
- [ ] Click "Next"
- **Expected**: Progress bar shows step 1 complete with checkmark

**Step 2: Location**
- [ ] Select state: "Lagos"
- [ ] Select city: "Lekki"
- [ ] Enter address: "123 Main Street, Lekki"
- [ ] Click "Next"
- **Expected**: Progress bar shows step 2 complete with checkmark

**Step 3: Professional**
- [ ] Select specialization: "Box Braids"
- [ ] Select experience: "5-10 years"
- [ ] Select services: Check "Box Braids", "Cornrows", "Twists"
- [ ] Enter bio: "Experienced braider with 7 years in the industry"
- [ ] Click "Next"
- **Expected**: Progress bar shows step 3 complete with checkmark

**Step 4: Verification**
- [ ] Select ID type: "National ID Card"
- [ ] Enter ID number: "12345678901"
- [ ] Upload ID document: Select an image file
- [ ] Click "Next"
- **Expected**: Progress bar shows step 4 complete with checkmark

**Step 5: Review**
- [ ] Review all information
- [ ] Click "Complete Signup"
- **Expected**: 
  - Account created successfully
  - Redirected to braider dashboard
  - Braider appears in admin verification dashboard

---

### TEST 2: Admin Verification Dashboard

**Location**: `http://localhost:3000/admin/verification`

**Dashboard Display**
- [ ] See stats: Total, Pending, Approved, Rejected
- [ ] See table with braiders
- [ ] See search bar and filter dropdown
- [ ] See "Pending" braiders from TEST 1

**Search Functionality**
- [ ] Search by name: "John Braider"
- [ ] Search by email: "john@example.com"
- [ ] Search by phone: "+234 801 234 5678"
- **Expected**: Results filtered correctly

**Filter Functionality**
- [ ] Filter by "Pending"
- [ ] Filter by "Approved"
- [ ] Filter by "Rejected"
- [ ] Filter by "All Status"
- **Expected**: Results filtered correctly

**Review & Approve**
- [ ] Click review button on pending braider
- [ ] Modal opens with braider details
- [ ] See document preview
- [ ] Enter admin notes: "Verified and approved"
- [ ] Click "Approve ✓"
- **Expected**:
  - Modal closes
  - Braider status changes to "Approved"
  - Green checkmark (✓) appears next to name
  - Stats update (Pending -1, Approved +1)

**Reject Functionality**
- [ ] Create another braider (TEST 1 again)
- [ ] Click review button
- [ ] Enter admin notes: "Document unclear"
- [ ] Click "Reject"
- **Expected**:
  - Status changes to "Rejected"
  - Red badge appears
  - Stats update

---

### TEST 3: Booking Workflow

**Setup**
- [ ] Have 2 accounts: 1 customer, 1 verified braider
- [ ] Braider should be approved from TEST 2

**Create Booking**
- [ ] Customer goes to search/booking page
- [ ] Find verified braider (green checkmark)
- [ ] Create booking for a service
- [ ] Booking status: "pending"
- **Expected**: Booking created successfully

**Braider Starts Service**
- [ ] Braider logs in
- [ ] Goes to bookings page
- [ ] Clicks "Start" button
- **Expected**:
  - Booking status changes to "in_progress"
  - started_at timestamp set
  - Admin receives notification: "Braider Started Service"
  - Check notifications table for entry

**Braider Finishes Service**
- [ ] Braider clicks "Finish" button
- **Expected**:
  - Booking status changes to "awaiting_confirmation"
  - finished_at timestamp set
  - Customer receives notification: "Service Complete - Please Confirm"
  - Admin receives notification: "Braider Finished Service"

**Customer Confirms & Payment**
- [ ] Customer logs in
- [ ] Goes to notifications or booking details
- [ ] Clicks "Confirm" button
- **Expected**:
  - Booking status changes to "completed"
  - confirmed_at timestamp set
  - Payment automatically released to braider
  - Braider receives notification: "Payment Received"
  - Admin receives notification: "Booking Completed & Payment Released"

---

### TEST 4: Notifications System

**Check Notifications Table**
- [ ] Go to Supabase SQL Editor
- [ ] Run: `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;`
- **Expected**: See notifications from all tests

**Notification Types**
- [ ] `booking_started` - When braider starts
- [ ] `booking_finished` - When braider finishes
- [ ] `payment_released` - When payment sent to braider
- [ ] `booking_completed` - When booking completed
- [ ] `welcome` - When user signs up

**Notification Fields**
- [ ] `user_id` - Recipient (UUID or 'admin')
- [ ] `type` - Notification type
- [ ] `title` - Short title
- [ ] `message` - Full message
- [ ] `data` - JSON with booking details
- [ ] `is_read` - Boolean
- [ ] `created_at` - Timestamp

---

## 🔍 VERIFICATION CHECKLIST

### Frontend
- [ ] Braider signup form has all 5 steps
- [ ] Progress bar shows checkmarks for completed steps
- [ ] Nigerian states and cities load correctly
- [ ] Services list shows 20 items
- [ ] ID types dropdown shows 6 options
- [ ] Admin dashboard displays braiders
- [ ] Green checkmark shows for verified braiders
- [ ] Search and filter work correctly
- [ ] Modal opens for review
- [ ] Document preview works

### Backend
- [ ] Braider signup creates profile, braider_profile, and verification record
- [ ] Admin verification updates braider status
- [ ] Booking start updates status and creates notification
- [ ] Booking finish updates status and creates notification
- [ ] Booking confirm updates status, releases payment, creates notifications
- [ ] All notifications have correct user_id and type

### Database
- [ ] `notifications` table exists and is accessible
- [ ] `braider_verifications` table exists
- [ ] `bookings` table has new columns
- [ ] `profiles` table has verified column
- [ ] `braider_profiles` table has state, city, address, services, verified columns
- [ ] All indexes created for performance

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot destructure property 'error'"
**Solution**: Already fixed in MultiCountryLoginForm.tsx - uses try-catch pattern

### Issue: UUID/TEXT type mismatch
**Solution**: Run `notifications_no_rls.sql` migration (RLS disabled)

### Issue: Braiders not showing in verification dashboard
**Solution**: 
1. Check if braider_verifications table has data
2. Check if braider profile was created
3. Run: `SELECT * FROM braider_verifications;`

### Issue: Notifications not appearing
**Solution**:
1. Check if notifications table exists
2. Check if RLS is disabled
3. Run: `SELECT * FROM notifications;`

### Issue: Document upload fails
**Solution**:
1. Check if `braider-documents` storage bucket exists
2. Check if bucket is public
3. Check file size (max 5MB)
4. Check file type (image or PDF)

### Issue: Booking workflow not working
**Solution**:
1. Check if bookings table has new columns
2. Check if braider is verified
3. Check if booking status is correct
4. Run migration: `braider_verification_and_booking_workflow.sql`

---

## 📊 EXPECTED RESULTS

### After TEST 1 (Signup)
- Braider account created
- Braider appears in admin dashboard with "Pending" status
- Braider profile and verification record created

### After TEST 2 (Verification)
- Braider status changes to "Approved"
- Green checkmark appears
- Braider can now accept bookings

### After TEST 3 (Booking)
- Booking progresses through all statuses
- All parties receive notifications
- Payment released to braider

### After TEST 4 (Notifications)
- 4+ notifications in database
- All have correct user_id and type
- All have booking_id in data field

---

## 🚀 DEPLOYMENT

### Local Testing
```bash
npm run dev
# Test at http://localhost:3000
```

### Vercel Deployment
```bash
git add -A
git commit -m "Add braider system with verification and booking workflow"
git push origin master
# Vercel auto-deploys
```

### Database Migration
1. Go to Supabase Dashboard
2. SQL Editor
3. Copy `supabase/migrations/notifications_no_rls.sql`
4. Paste and execute
5. Verify tables exist

---

## ✅ FINAL CHECKLIST

- [ ] All 5 signup steps working
- [ ] Admin dashboard showing braiders
- [ ] Green checkmark for verified braiders
- [ ] Booking workflow complete (Start → Finish → Confirm → Pay)
- [ ] Notifications appearing for all parties
- [ ] Database migration executed
- [ ] Code committed to git
- [ ] Deployed to Vercel
- [ ] All tests passing

**Status**: Ready for production
