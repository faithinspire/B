-- ============================================================================
-- FINAL COMPLETE RLS DISABLE - BRUTE FORCE ALL TABLES
-- ============================================================================
-- This script COMPLETELY disables RLS on ALL tables
-- Run this in Supabase SQL Editor to allow all operations without RLS restrictions

-- ============================================================================
-- 1. DISABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS location_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS location_tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP ALL EXISTING POLICIES (COMPLETE CLEANUP)
-- ============================================================================
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Braiders can read own profile" ON braider_profiles;
DROP POLICY IF EXISTS "Braiders can update own profile" ON braider_profiles;
DROP POLICY IF EXISTS "Anyone can read braider profiles" ON braider_profiles;
DROP POLICY IF EXISTS "Braiders can read own services" ON services;
DROP POLICY IF EXISTS "Braiders can insert own services" ON services;
DROP POLICY IF EXISTS "Braiders can update own services" ON services;
DROP POLICY IF EXISTS "Braiders can delete own services" ON services;
DROP POLICY IF EXISTS "Anyone can read active services" ON services;
DROP POLICY IF EXISTS "Braiders can read own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Braiders can insert own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Braiders can delete own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Anyone can read portfolio" ON portfolio;
DROP POLICY IF EXISTS "Customers can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Braiders can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Braiders can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Customers can insert payments" ON payments;
DROP POLICY IF EXISTS "Braiders can read own payouts" ON payouts;
DROP POLICY IF EXISTS "Braiders can insert payouts" ON payouts;
DROP POLICY IF EXISTS "Anyone can read ratings" ON ratings;
DROP POLICY IF EXISTS "Users can insert ratings" ON ratings;
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can read notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete favorites" ON favorites;
DROP POLICY IF EXISTS "Users can read own location" ON location_tracking;
DROP POLICY IF EXISTS "Users can insert location" ON location_tracking;
DROP POLICY IF EXISTS "Braiders can read own sessions" ON location_tracking_sessions;
DROP POLICY IF EXISTS "Braiders can read own transactions" ON transactions;

-- ============================================================================
-- 3. VERIFY ALL RLS IS DISABLED
-- ============================================================================
-- Run this query to verify all tables have RLS disabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('profiles', 'braider_profiles', 'services', 'portfolio', 'bookings', 'payments', 'payouts', 'ratings', 'messages', 'conversations', 'notifications', 'favorites', 'location_tracking', 'location_tracking_sessions', 'transactions');
-- All should show rowsecurity = false

-- ============================================================================
-- DONE - ALL RLS DISABLED, ALL OPERATIONS ALLOWED
-- ============================================================================
-- Now all API routes will work without RLS violations
-- Uploads, service additions, and all database operations will succeed
