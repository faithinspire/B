-- ============================================================================
-- MINIMAL RLS DISABLE - NO TABLE CREATION OR ALTERATION
-- ============================================================================
-- This migration ONLY disables RLS on existing tables.
-- It does NOT create or alter any tables to avoid schema conflicts.

-- ============================================================================
-- 1. DISABLE RLS ON ALL EXISTING TABLES (IF THEY EXIST)
-- ============================================================================

DO $$ 
BEGIN
  -- Disable RLS on all tables that exist
  EXECUTE 'ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS braider_profiles DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS barber_profiles DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS portfolio DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS payouts DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS ratings DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS favorites DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS location_tracking DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS location_tracking_sessions DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS marketplace_categories DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS marketplace_products DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS marketplace_orders DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS marketplace_order_items DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS marketplace_cart DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS marketplace_reviews DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS marketplace_wishlist DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS marketplace_sales_analytics DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS braider_status DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS barber_status DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS payment_transactions DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS payment_settings DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS payment_reconciliation DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS braider_verification DISABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE IF EXISTS phone_login_mappings DISABLE ROW LEVEL SECURITY';
END $$;

-- ============================================================================
-- 2. GRANT ALL PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- 3. DONE - RLS IS NOW DISABLED ON ALL TABLES
-- ============================================================================
-- The app should now work without permission errors.
