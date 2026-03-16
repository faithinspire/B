-- Add missing tables for critical features
-- IMPORTANT: All foreign keys must reference UUID columns with UUID type

-- Availability slots for braiders
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES braider_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(braider_id, date, start_time, end_time)
);

-- Fraud alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('multiple_chargebacks', 'rapid_cancellations', 'suspicious_bookings', 'fake_reviews', 'other')),
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs for admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referral rewards tracking
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_amount NUMERIC(10,2),
  reward_type TEXT CHECK (reward_type IN ('credit', 'commission_reduction')) DEFAULT 'credit',
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Incident reports for safety (booking_id is TEXT to match bookings.id type)
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('emergency', 'safety_concern', 'harassment', 'property_damage', 'other')),
  description TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326),
  evidence_urls TEXT[],
  status TEXT CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')) DEFAULT 'reported',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_incident_reports_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- User blocks/reports
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Payment methods for customers
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_last_four TEXT,
  card_brand TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, stripe_payment_method_id)
);

-- Enable RLS on new tables
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for availability_slots
CREATE POLICY "Braiders can manage own availability" ON availability_slots
  FOR ALL USING (braider_id = auth.uid());

CREATE POLICY "Public can read availability" ON availability_slots
  FOR SELECT USING (is_available = true);

-- RLS Policies for fraud_alerts
CREATE POLICY "Admins can read fraud alerts" ON fraud_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for referral_rewards
CREATE POLICY "Users can read own referral rewards" ON referral_rewards
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- RLS Policies for incident_reports
CREATE POLICY "Admins can read all incidents" ON incident_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read own incidents" ON incident_reports
  FOR SELECT USING (reported_by = auth.uid());

CREATE POLICY "Users can create incidents" ON incident_reports
  FOR INSERT WITH CHECK (reported_by = auth.uid());

-- RLS Policies for user_blocks
CREATE POLICY "Users can manage own blocks" ON user_blocks
  FOR ALL USING (blocker_id = auth.uid());

CREATE POLICY "Users can read own blocks" ON user_blocks
  FOR SELECT USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

-- RLS Policies for payment_methods
CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_availability_slots_braider_date ON availability_slots(braider_id, date);
CREATE INDEX idx_fraud_alerts_user ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_incident_reports_booking ON incident_reports(booking_id);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
