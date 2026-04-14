-- Braider Verification System Schema
-- Comprehensive verification workflow for braiders

-- 1. Verification Status Table
CREATE TABLE IF NOT EXISTS braider_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Verification Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Braider Details
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  location_country VARCHAR(100),
  location_state VARCHAR(100),
  location_city VARCHAR(100),
  years_experience INTEGER,
  specialization VARCHAR(255),
  
  -- Documents
  id_document_url VARCHAR(500),
  id_document_type VARCHAR(50),
  id_number VARCHAR(100),
  selfie_url VARCHAR(500),
  
  -- Admin Review
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 2. Verification Audit Log
CREATE TABLE IF NOT EXISTS verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  admin_id UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Verification Notifications
CREATE TABLE IF NOT EXISTS verification_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_braider_verification_user_id ON braider_verification(user_id);
CREATE INDEX idx_braider_verification_status ON braider_verification(status);
CREATE INDEX idx_braider_verification_submitted_at ON braider_verification(submitted_at DESC);
CREATE INDEX idx_verification_audit_user_id ON verification_audit_log(user_id);
CREATE INDEX idx_verification_audit_created_at ON verification_audit_log(created_at DESC);
CREATE INDEX idx_verification_notifications_user_id ON verification_notifications(user_id);
CREATE INDEX idx_verification_notifications_is_read ON verification_notifications(is_read);

-- Enable RLS
ALTER TABLE braider_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for braider_verification
CREATE POLICY "Users can view their own verification" ON braider_verification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications" ON braider_verification
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own verification" ON braider_verification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification" ON braider_verification
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update verifications" ON braider_verification
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for verification_audit_log
CREATE POLICY "Users can view their own audit log" ON verification_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON verification_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs" ON verification_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for verification_notifications
CREATE POLICY "Users can view their own notifications" ON verification_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON verification_notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update their own notifications" ON verification_notifications
  FOR UPDATE USING (auth.uid() = user_id);
