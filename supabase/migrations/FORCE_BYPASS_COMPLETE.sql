-- COMPLETE FORCE BYPASS - DROPS ALL EXISTING POLICIES AND RECREATES CLEAN
-- This will work even if there are existing constraints or policies

-- Step 1: Drop all existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can update their own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can insert their own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Braiders can view their own location tracking" ON location_tracking;
DROP POLICY IF EXISTS "Braiders can insert their own location" ON location_tracking;
DROP POLICY IF EXISTS "Service role can insert location" ON location_tracking;

-- Step 2: Drop all existing tables (if they exist)
DROP TABLE IF EXISTS location_tracking CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_metadata CASCADE;

-- Step 3: Create user_metadata table (FRESH)
CREATE TABLE user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  next_of_kin_relationship TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create notifications table (FRESH)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create location_tracking table (FRESH)
CREATE TABLE location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT,
  braider_id UUID NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 6: Create all indexes
CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id);
CREATE INDEX idx_user_metadata_created_at ON user_metadata(created_at DESC);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);

CREATE INDEX idx_location_tracking_booking_id ON location_tracking(booking_id);
CREATE INDEX idx_location_tracking_braider_id ON location_tracking(braider_id);
CREATE INDEX idx_location_tracking_created_at ON location_tracking(created_at DESC);
CREATE INDEX idx_location_tracking_braider_created ON location_tracking(braider_id, created_at DESC);

-- Step 7: Enable RLS
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS Policies for user_metadata
CREATE POLICY "Users can view their own metadata" ON user_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own metadata" ON user_metadata
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metadata" ON user_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 9: Create RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Step 10: Create RLS Policies for location_tracking
CREATE POLICY "Braiders can view their own location tracking" ON location_tracking
  FOR SELECT USING (auth.uid() = braider_id);

CREATE POLICY "Braiders can insert their own location" ON location_tracking
  FOR INSERT WITH CHECK (auth.uid() = braider_id);

CREATE POLICY "Service role can insert location" ON location_tracking
  FOR INSERT WITH CHECK (true);

-- Step 11: Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON location_tracking TO authenticated;

-- Step 12: Verify tables exist
SELECT 'user_metadata' as table_name, COUNT(*) as row_count FROM user_metadata
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'location_tracking', COUNT(*) FROM location_tracking;
