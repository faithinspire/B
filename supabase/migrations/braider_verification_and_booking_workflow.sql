-- Add verification status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- Create braider_verifications table
CREATE TABLE IF NOT EXISTS braider_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_type TEXT NOT NULL,
  id_number TEXT NOT NULL,
  document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add booking workflow columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_braider_verifications_braider_id ON braider_verifications(braider_id);
CREATE INDEX IF NOT EXISTS idx_braider_verifications_status ON braider_verifications(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_braider_id ON bookings(braider_id);

-- Add braider profile fields
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS on new tables
ALTER TABLE braider_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for braider_verifications
CREATE POLICY "Admins can view all verifications" ON braider_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Braiders can view their own verification" ON braider_verifications
  FOR SELECT USING (braider_id = auth.uid());

CREATE POLICY "Braiders can insert their own verification" ON braider_verifications
  FOR INSERT WITH CHECK (braider_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid()::text OR user_id = 'admin');

CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);
