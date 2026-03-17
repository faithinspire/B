-- Add next of kin fields to users table
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking_created', 'booking_accepted', 'booking_completed', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add location fields to bookings for better tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_latitude DECIMAL(10, 8);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_longitude DECIMAL(11, 8);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS braider_latitude DECIMAL(10, 8);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS braider_longitude DECIMAL(11, 8);

-- Create location_tracking table for real-time tracking
CREATE TABLE IF NOT EXISTS location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_tracking_booking_id ON location_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_braider_id ON location_tracking(braider_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_created_at ON location_tracking(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for location_tracking
CREATE POLICY "Braiders can view their own location tracking" ON location_tracking
  FOR SELECT USING (auth.uid() = braider_id);

CREATE POLICY "Braiders can insert their own location" ON location_tracking
  FOR INSERT WITH CHECK (auth.uid() = braider_id);
