-- ============================================================================
-- COMPLETE DATABASE SCHEMA - HARD FIX FOR ALL ISSUES
-- ============================================================================
-- This is the DEFINITIVE schema. Run this in Supabase SQL Editor.
-- It creates ALL tables with proper columns, RLS policies, and indexes.

-- ============================================================================
-- 1. PROFILES TABLE (for all users - avatars)
-- ============================================================================
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can update profiles" ON profiles FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- 2. BRAIDER_PROFILES TABLE (braider-specific data)
-- ============================================================================
DROP TABLE IF EXISTS braider_profiles CASCADE;
CREATE TABLE braider_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  travel_radius_miles INTEGER DEFAULT 10,
  is_mobile BOOLEAN DEFAULT true,
  salon_address TEXT,
  specialties TEXT[] DEFAULT '{}',
  total_earnings DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE braider_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Braiders can read own profile" ON braider_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Braiders can update own profile" ON braider_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read braider profiles" ON braider_profiles FOR SELECT USING (true);
CREATE INDEX idx_braider_profiles_user_id ON braider_profiles(user_id);
CREATE INDEX idx_braider_profiles_verification ON braider_profiles(verification_status);

-- ============================================================================
-- 3. SERVICES TABLE
-- ============================================================================
DROP TABLE IF EXISTS services CASCADE;
CREATE TABLE services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Braiders can read own services" ON services FOR SELECT USING (auth.uid() = braider_id);
CREATE POLICY "Braiders can insert own services" ON services FOR INSERT WITH CHECK (auth.uid() = braider_id);
CREATE POLICY "Braiders can update own services" ON services FOR UPDATE USING (auth.uid() = braider_id);
CREATE POLICY "Braiders can delete own services" ON services FOR DELETE USING (auth.uid() = braider_id);
CREATE POLICY "Anyone can read active services" ON services FOR SELECT USING (is_active = true);
CREATE INDEX idx_services_braider_id ON services(braider_id);
CREATE INDEX idx_services_is_active ON services(is_active);

-- ============================================================================
-- 4. PORTFOLIO TABLE (SINGLE SOURCE OF TRUTH)
-- ============================================================================
DROP TABLE IF EXISTS portfolio CASCADE;
CREATE TABLE portfolio (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Braiders can read own portfolio" ON portfolio FOR SELECT USING (auth.uid() = braider_id);
CREATE POLICY "Braiders can insert own portfolio" ON portfolio FOR INSERT WITH CHECK (auth.uid() = braider_id);
CREATE POLICY "Braiders can delete own portfolio" ON portfolio FOR DELETE USING (auth.uid() = braider_id);
CREATE POLICY "Anyone can read portfolio" ON portfolio FOR SELECT USING (true);
CREATE INDEX idx_portfolio_braider_id ON portfolio(braider_id);

-- ============================================================================
-- 5. BOOKINGS TABLE
-- ============================================================================
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  braider_name TEXT NOT NULL,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  location_address TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  braider_payout DECIMAL(10,2) DEFAULT 0,
  escrow_released BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can read own bookings" ON bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Braiders can read own bookings" ON bookings FOR SELECT USING (auth.uid() = braider_id);
CREATE POLICY "Customers can insert bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Braiders can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = braider_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_braider_id ON bookings(braider_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================================================
-- 6. PAYMENTS TABLE
-- ============================================================================
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = braider_id);
CREATE POLICY "Customers can insert payments" ON payments FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_braider_id ON payments(braider_id);

-- ============================================================================
-- 7. PAYOUTS TABLE
-- ============================================================================
DROP TABLE IF EXISTS payouts CASCADE;
CREATE TABLE payouts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  bank_account TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Braiders can read own payouts" ON payouts FOR SELECT USING (auth.uid() = braider_id);
CREATE POLICY "Braiders can insert payouts" ON payouts FOR INSERT WITH CHECK (auth.uid() = braider_id);
CREATE INDEX idx_payouts_braider_id ON payouts(braider_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ============================================================================
-- 8. RATINGS TABLE
-- ============================================================================
DROP TABLE IF EXISTS ratings CASCADE;
CREATE TABLE ratings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE INDEX idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX idx_ratings_ratee_id ON ratings(ratee_id);

-- ============================================================================
-- 9. MESSAGES TABLE
-- ============================================================================
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);

-- ============================================================================
-- 10. CONVERSATIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS conversations CASCADE;
CREATE TABLE conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own conversations" ON conversations FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE INDEX idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2_id ON conversations(participant2_id);

-- ============================================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================================
-- 12. FAVORITES TABLE
-- ============================================================================
DROP TABLE IF EXISTS favorites CASCADE;
CREATE TABLE favorites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, braider_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_braider_id ON favorites(braider_id);

-- ============================================================================
-- 13. LOCATION_TRACKING TABLE
-- ============================================================================
DROP TABLE IF EXISTS location_tracking CASCADE;
CREATE TABLE location_tracking (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own location" ON location_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert location" ON location_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_location_tracking_user_id ON location_tracking(user_id);

-- ============================================================================
-- 14. LOCATION_TRACKING_SESSIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS location_tracking_sessions CASCADE;
CREATE TABLE location_tracking_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE location_tracking_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Braiders can read own sessions" ON location_tracking_sessions FOR SELECT USING (auth.uid() = braider_id);
CREATE INDEX idx_location_sessions_booking_id ON location_tracking_sessions(booking_id);
CREATE INDEX idx_location_sessions_braider_id ON location_tracking_sessions(braider_id);

-- ============================================================================
-- 15. TRANSACTIONS TABLE (for wallet/earnings tracking)
-- ============================================================================
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Braiders can read own transactions" ON transactions FOR SELECT USING (auth.uid() = braider_id);
CREATE INDEX idx_transactions_braider_id ON transactions(braider_id);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify all tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT * FROM pg_policies ORDER BY tablename;
