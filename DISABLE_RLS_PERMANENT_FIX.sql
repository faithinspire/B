-- ============================================================================
-- PERMANENT RLS DISABLE - ALLOW ALL DATA ACCESS
-- ============================================================================
-- This disables RLS on all critical tables to ensure:
-- 1. Admin can see all users and braiders
-- 2. Profiles load correctly for role determination
-- 3. No data is blocked by RLS policies

-- ============================================================================
-- DISABLE RLS ON PROFILES TABLE
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON BRAIDER_PROFILES TABLE
-- ============================================================================
ALTER TABLE public.braider_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON BOOKINGS TABLE
-- ============================================================================
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON PAYMENTS TABLE
-- ============================================================================
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON MESSAGES TABLE
-- ============================================================================
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON CONVERSATIONS TABLE
-- ============================================================================
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON SERVICES TABLE
-- ============================================================================
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON REVIEWS TABLE
-- ============================================================================
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON DISPUTES TABLE
-- ============================================================================
ALTER TABLE public.disputes DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON NOTIFICATIONS TABLE
-- ============================================================================
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DISABLE RLS ON LOCATION_HISTORY TABLE
-- ============================================================================
ALTER TABLE public.location_history DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFY RLS IS DISABLED
-- ============================================================================
-- Run this query to verify RLS is disabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- All should show 'f' (false) for rowsecurity
