-- ============================================================================
-- PHASE 1: MESSAGING & ADMIN MONITORING SYSTEM - DATABASE MIGRATION
-- ============================================================================
-- This migration creates all required tables for the messaging and admin
-- monitoring system with proper RLS policies and indexes.
-- Run this in Supabase SQL Editor.

-- ============================================================================
-- 1. CONVERSATIONS TABLE - Enhanced with admin_id field
-- ============================================================================
DROP TABLE IF EXISTS conversations CASCADE;
CREATE TABLE conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own conversations" ON conversations
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Braiders can read own conversations" ON conversations
  FOR SELECT USING (auth.uid() = braider_id);

CREATE POLICY "Admins can read all conversations" ON conversations
  FOR SELECT USING (auth.uid() = admin_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can insert conversations" ON conversations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update conversations" ON conversations
  FOR UPDATE USING (auth.role() = 'service_role');

-- Indexes for conversations
CREATE INDEX idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_braider_id ON conversations(braider_id);
CREATE INDEX idx_conversations_admin_id ON conversations(admin_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- ============================================================================
-- 2. MESSAGES TABLE - Enhanced with message_type and metadata
-- ============================================================================
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'braider', 'admin')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'image', 'system')),
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (
        auth.uid() = c.customer_id
        OR auth.uid() = c.braider_id
        OR auth.uid() = c.admin_id
      )
    )
  );

CREATE POLICY "Service role can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update messages" ON messages
  FOR UPDATE USING (auth.role() = 'service_role');

-- Indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(read);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- ============================================================================
-- 3. LOCATION_TRACKING TABLE - Enhanced with speed and heading
-- ============================================================================
DROP TABLE IF EXISTS location_tracking CASCADE;
CREATE TABLE location_tracking (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  speed DECIMAL(10,2),
  heading DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for location_tracking
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Braiders can read own location" ON location_tracking
  FOR SELECT USING (auth.uid() = braider_id);

CREATE POLICY "Customers can read location for their bookings" ON location_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = location_tracking.booking_id
      AND auth.uid() = b.customer_id
    )
  );

CREATE POLICY "Admins can read all locations" ON location_tracking
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert location" ON location_tracking
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update location" ON location_tracking
  FOR UPDATE USING (auth.role() = 'service_role');

-- Indexes for location_tracking
CREATE INDEX idx_location_tracking_booking_id ON location_tracking(booking_id);
CREATE INDEX idx_location_tracking_braider_id ON location_tracking(braider_id);
CREATE INDEX idx_location_tracking_is_active ON location_tracking(is_active);
CREATE INDEX idx_location_tracking_created_at ON location_tracking(created_at DESC);
CREATE INDEX idx_location_tracking_booking_created ON location_tracking(booking_id, created_at DESC);

-- ============================================================================
-- 4. PAYMENT_NOTIFICATIONS TABLE - New
-- ============================================================================
DROP TABLE IF EXISTS payment_notifications CASCADE;
CREATE TABLE payment_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  notification_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for payment_notifications
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all payment notifications" ON payment_notifications
  FOR SELECT USING (auth.uid() = admin_id OR auth.role() = 'service_role');

CREATE POLICY "Customers can read own payment notifications" ON payment_notifications
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Braiders can read own payment notifications" ON payment_notifications
  FOR SELECT USING (auth.uid() = braider_id);

CREATE POLICY "Service role can insert payment notifications" ON payment_notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update payment notifications" ON payment_notifications
  FOR UPDATE USING (auth.role() = 'service_role');

-- Indexes for payment_notifications
CREATE INDEX idx_payment_notifications_booking_id ON payment_notifications(booking_id);
CREATE INDEX idx_payment_notifications_payment_id ON payment_notifications(payment_id);
CREATE INDEX idx_payment_notifications_admin_id ON payment_notifications(admin_id);
CREATE INDEX idx_payment_notifications_customer_id ON payment_notifications(customer_id);
CREATE INDEX idx_payment_notifications_braider_id ON payment_notifications(braider_id);
CREATE INDEX idx_payment_notifications_status ON payment_notifications(status);
CREATE INDEX idx_payment_notifications_created_at ON payment_notifications(created_at DESC);

-- ============================================================================
-- 5. ADMIN_ACCESS_LOGS TABLE - New
-- ============================================================================
DROP TABLE IF EXISTS admin_access_logs CASCADE;
CREATE TABLE admin_access_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('joined', 'left', 'viewed_location', 'sent_message')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for admin_access_logs
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own access logs" ON admin_access_logs
  FOR SELECT USING (auth.uid() = admin_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can insert access logs" ON admin_access_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Indexes for admin_access_logs
CREATE INDEX idx_admin_access_logs_admin_id ON admin_access_logs(admin_id);
CREATE INDEX idx_admin_access_logs_conversation_id ON admin_access_logs(conversation_id);
CREATE INDEX idx_admin_access_logs_action ON admin_access_logs(action);
CREATE INDEX idx_admin_access_logs_timestamp ON admin_access_logs(timestamp DESC);
CREATE INDEX idx_admin_access_logs_admin_timestamp ON admin_access_logs(admin_id, timestamp DESC);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify all tables were created successfully:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('conversations', 'messages', 'location_tracking', 'payment_notifications', 'admin_access_logs') ORDER BY tablename;
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('conversations', 'messages', 'location_tracking', 'payment_notifications', 'admin_access_logs') ORDER BY tablename, policyname;
-- SELECT tablename, indexname FROM pg_indexes WHERE tablename IN ('conversations', 'messages', 'location_tracking', 'payment_notifications', 'admin_access_logs') ORDER BY tablename, indexname;
