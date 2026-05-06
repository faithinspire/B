-- SAFE RLS DISABLE - Only disables RLS on tables that exist
-- This script will skip tables that don't exist

-- Disable RLS on profiles table
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on braider_profiles table
ALTER TABLE IF EXISTS braider_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on services table
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;

-- Disable RLS on portfolio table
ALTER TABLE IF EXISTS portfolio DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bookings table
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on messages table
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on notifications table
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on payments table
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on reviews table
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;

-- Disable RLS on disputes table
ALTER TABLE IF EXISTS disputes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on favorites table
ALTER TABLE IF EXISTS favorites DISABLE ROW LEVEL SECURITY;

-- Disable RLS on location_tracking table
ALTER TABLE IF EXISTS location_tracking DISABLE ROW LEVEL SECURITY;

-- Disable RLS on verification_documents table (if exists)
ALTER TABLE IF EXISTS verification_documents DISABLE ROW LEVEL SECURITY;

-- Disable RLS on admin_logs table (if exists)
ALTER TABLE IF EXISTS admin_logs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on transactions table (if exists)
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;

-- Verify which tables have RLS disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
