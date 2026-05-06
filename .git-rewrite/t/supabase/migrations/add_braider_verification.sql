-- Add verification status to braider_profiles
ALTER TABLE braider_profiles 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_braider_verification_status ON braider_profiles(verification_status);
