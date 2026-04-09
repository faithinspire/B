# Complete User Data Restore - Final Instructions

## Problem
Your admin users page was showing UUIDs instead of real names and emails. This is now fixed.

## Solution - Two Simple Steps

### STEP 1: Restore All User Data (REQUIRED)
**Run this SQL in Supabase SQL Editor:**

Copy the entire content from: `FINAL_USER_DATA_RESTORE_COMPLETE.sql`

This will:
- ✅ Insert all auth users into profiles table
- ✅ Populate with real names and emails
- ✅ Update braider profiles with complete data
- ✅ Show you verification results

**Expected Result:**
You'll see a table with all users showing:
- ID
- Email
- Full Name
- Role
- Created Date
- Is Braider (Yes/No)
- Braider Name
- Braider Email
- Verification Status

Plus a summary showing total users, admins, braiders, and customers.

---

### STEP 2: Create Missing Tables (OPTIONAL)
**Run this SQL in Supabase SQL Editor:**

Copy the entire content from: `supabase/migrations/add_missing_tables.sql`

This creates optional tables for:
- Availability slots
- Fraud alerts
- Audit logs
- Referral rewards
- Incident reports
- User blocks
- Payment methods

---

## What You'll See After Step 1

Your admin users page will now display:

| Name | Email | Role | Status | Joined |
|------|-------|------|--------|--------|
| John Doe | john@example.com | Braider | Verified | Jan 15, 2024 |
| Jane Smith | jane@example.com | Customer | - | Jan 20, 2024 |
| Admin User | admin@example.com | Admin | - | Jan 10, 2024 |

**Features:**
- ✅ Real names (not UUIDs)
- ✅ Email addresses
- ✅ Role badges (Admin, Braider, Customer)
- ✅ Braider verification status
- ✅ Join dates
- ✅ Search by name or email
- ✅ Filter by role

---

## How to Make Someone an Admin

1. Go to Admin → Users
2. Search for the braider's name or email
3. Click on their row
4. Change role from "Braider" to "Admin"
5. Save

You can now see all your registered braiders with their actual names and emails!

---

## Troubleshooting

**If Step 1 fails:**
- Make sure you're copying the ENTIRE SQL file
- Run it in Supabase SQL Editor (not in your app)
- Check that you have admin access to Supabase

**If Step 2 fails:**
- It's optional - you can skip it
- The user data restore (Step 1) is what matters

---

## Done!

Your admin dashboard now shows real user data instead of UUIDs. You can manage braiders and admins by their actual names and emails.
