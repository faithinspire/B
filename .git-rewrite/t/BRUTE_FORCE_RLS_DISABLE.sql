-- BRUTE FORCE RLS DISABLE - COMPLETE AND PERMANENT
-- This will completely disable RLS on ALL tables and remove ALL policies

-- Step 1: Disable RLS on all tables
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS location_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS verification_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing RLS policies on all tables
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "braider_profiles_select_policy" ON braider_profiles;
DROP POLICY IF EXISTS "braider_profiles_insert_policy" ON braider_profiles;
DROP POLICY IF EXISTS "braider_profiles_update_policy" ON braider_profiles;
DROP POLICY IF EXISTS "braider_profiles_delete_policy" ON braider_profiles;

DROP POLICY IF EXISTS "services_select_policy" ON services;
DROP POLICY IF EXISTS "services_insert_policy" ON services;
DROP POLICY IF EXISTS "services_update_policy" ON services;
DROP POLICY IF EXISTS "services_delete_policy" ON services;

DROP POLICY IF EXISTS "portfolio_select_policy" ON portfolio;
DROP POLICY IF EXISTS "portfolio_insert_policy" ON portfolio;
DROP POLICY IF EXISTS "portfolio_update_policy" ON portfolio;
DROP POLICY IF EXISTS "portfolio_delete_policy" ON portfolio;

DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_update_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_delete_policy" ON bookings;

DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;

DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_policy" ON reviews;

DROP POLICY IF EXISTS "disputes_select_policy" ON disputes;
DROP POLICY IF EXISTS "disputes_insert_policy" ON disputes;
DROP POLICY IF EXISTS "disputes_update_policy" ON disputes;
DROP POLICY IF EXISTS "disputes_delete_policy" ON disputes;

DROP POLICY IF EXISTS "favorites_select_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_insert_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_update_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_delete_policy" ON favorites;

DROP POLICY IF EXISTS "location_tracking_select_policy" ON location_tracking;
DROP POLICY IF EXISTS "location_tracking_insert_policy" ON location_tracking;
DROP POLICY IF EXISTS "location_tracking_update_policy" ON location_tracking;
DROP POLICY IF EXISTS "location_tracking_delete_policy" ON location_tracking;

DROP POLICY IF EXISTS "verification_documents_select_policy" ON verification_documents;
DROP POLICY IF EXISTS "verification_documents_insert_policy" ON verification_documents;
DROP POLICY IF EXISTS "verification_documents_update_policy" ON verification_documents;
DROP POLICY IF EXISTS "verification_documents_delete_policy" ON verification_documents;

DROP POLICY IF EXISTS "admin_logs_select_policy" ON admin_logs;
DROP POLICY IF EXISTS "admin_logs_insert_policy" ON admin_logs;
DROP POLICY IF EXISTS "admin_logs_update_policy" ON admin_logs;
DROP POLICY IF EXISTS "admin_logs_delete_policy" ON admin_logs;

DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_policy" ON transactions;

-- Step 3: Verify RLS is completely disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Step 4: Show all remaining policies (should be empty)
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
