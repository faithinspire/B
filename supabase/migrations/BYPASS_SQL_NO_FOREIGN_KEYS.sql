-- COMPLETE BYPASS - NO FOREIGN KEY DEPENDENCIES
-- This migration creates all necessary tables without foreign key constraints
-- Safe to run even if bookings table doesn't exist

-- 1. Create user_metadata table for next of kin
CREATE TABLE IF NOT EXISTS user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  next_of_kin_relationship TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create notifications table (no foreign keys)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create location_tracking table (no foreign keys)
CREATE TABLE IF NOT EXISTS location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  braider_id UUID NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_metadata_user_id ON user_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_created_at ON user_metadata(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_location_tracking_booking_id ON location_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_braider_id ON location_tracking(braider_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_created_at ON location_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_tracking_braider_created ON location_tracking(braider_id, created_at DESC);

-- 5. Enable RLS for security
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for user_metadata
DROP POLICY IF EXISTS "Users can view their own metadata" ON user_metadata;
CREATE POLICY "Users can view their own metadata" ON user_metadata
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own metadata" ON user_metadata;
CREATE POLICY "Users can update their own metadata" ON user_metadata
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own metadata" ON user_metadata;
CREATE POLICY "Users can insert their own metadata" ON user_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- 8. RLS Policies for location_tracking
DROP POLICY IF EXISTS "Braiders can view their own location tracking" ON location_tracking;
CREATE POLICY "Braiders can view their own location tracking" ON location_tracking
  FOR SELECT USING (auth.uid() = braider_id);

DROP POLICY IF EXISTS "Braiders can insert their own location" ON location_tracking;
CREATE POLICY "Braiders can insert their own location" ON location_tracking
  FOR INSERT WITH CHECK (auth.uid() = braider_id);

DROP POLICY IF EXISTS "Service role can insert location" ON location_tracking;
CREATE POLICY "Service role can insert location" ON location_tracking
  FOR INSERT WITH CHECK (true);

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON location_tracking TO authenticated;
