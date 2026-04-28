-- Create password_reset_tokens table for storing password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on token_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);

-- Create index on expires_at for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Disable RLS for this table (admin only)
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON password_reset_tokens TO authenticated;
GRANT ALL ON password_reset_tokens TO service_role;
