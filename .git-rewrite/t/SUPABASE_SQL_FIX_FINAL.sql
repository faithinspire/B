-- ============================================================================
-- SUPABASE SQL FIX - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- This fixes the foreign key constraint error for incident_reports table
-- The issue: booking_id references bookings.id which is TEXT type, not UUID

-- STEP 1: Drop the problematic constraint if it exists
ALTER TABLE IF EXISTS incident_reports DROP CONSTRAINT IF EXISTS incident_reports_booking_id_fkey;

-- STEP 2: Recreate incident_reports table with correct foreign key
DROP TABLE IF EXISTS incident_reports CASCADE;

CREATE TABLE incident_reports (
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

-- STEP 3: Enable RLS
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS policies
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

-- STEP 5: Create indexes for performance
CREATE INDEX idx_incident_reports_booking ON incident_reports(booking_id);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
CREATE INDEX idx_incident_reports_reported_by ON incident_reports(reported_by);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, verify:
-- 1. incident_reports table exists
-- 2. booking_id column is TEXT type
-- 3. Foreign key constraint is created
-- 4. RLS policies are enabled
-- 5. Indexes are created

-- Run this query to verify:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'incident_reports';
