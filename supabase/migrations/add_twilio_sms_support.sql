-- Add Twilio SMS support to password reset tokens table
-- This allows users to receive password reset links via SMS instead of just email

-- Add phone column to password_reset_tokens table if it doesn't exist
ALTER TABLE password_reset_tokens 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Make email nullable since we'll use either email or phone
ALTER TABLE password_reset_tokens 
ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure at least one of email or phone is provided
ALTER TABLE password_reset_tokens
ADD CONSTRAINT email_or_phone_required 
CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Add index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_phone 
ON password_reset_tokens(phone);

-- Add index on email for faster lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email 
ON password_reset_tokens(email);

-- Add index on token_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash 
ON password_reset_tokens(token_hash);

-- Add index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at 
ON password_reset_tokens(expires_at);

-- Add comment to document the changes
COMMENT ON COLUMN password_reset_tokens.phone IS 'Phone number for SMS-based password reset (alternative to email)';
