-- ============================================================================
-- SAFE RLS DISABLE - ONLY DISABLES ON TABLES THAT EXIST
-- ============================================================================
-- This script safely disables RLS on all tables that are defined in the schema
-- It does NOT try to drop policies or reference non-existent tables

-- Disable RLS on all tables that exist in the schema
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

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
