-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR
-- This will disable RLS on all tables and fix all upload errors

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on braider_profiles table
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on services table
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- Disable RLS on portfolio table
ALTER TABLE portfolio DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bookings table
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on messages table
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on notifications table
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on payments table
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on reviews table
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Disable RLS on disputes table
ALTER TABLE disputes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on favorites table
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;

-- Disable RLS on location_tracking table
ALTER TABLE location_tracking DISABLE ROW LEVEL SECURITY;

-- Disable RLS on verification_documents table
ALTER TABLE verification_documents DISABLE ROW LEVEL SECURITY;

-- Disable RLS on admin_logs table
ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on transactions table
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Verify all RLS is disabled - you should see 'f' (false) for all tables
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
