-- ============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR — fixes messages table schema
-- ============================================================================

-- The messages table may be missing columns. Add them if they don't exist.
-- This is safe to run multiple times (IF NOT EXISTS / DO blocks).

-- Add conversation_id if missing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Add sender_role if missing  
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'customer';

-- Add message_type if missing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- Add metadata if missing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- The read column: some schemas use 'read', some use 'is_read'
-- We'll standardize on 'read' (what the DB actually has)
-- Add 'read' column if missing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- If 'is_read' column exists, copy data to 'read' and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_read'
  ) THEN
    -- Copy is_read -> read
    UPDATE messages SET read = is_read WHERE read IS NULL OR read = false;
    -- Drop is_read
    ALTER TABLE messages DROP COLUMN IF EXISTS is_read;
  END IF;
END $$;

-- Add created_at if missing (some schemas use 'timestamp')
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update created_at from timestamp if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'timestamp'
  ) THEN
    UPDATE messages SET created_at = "timestamp" WHERE created_at IS NULL;
  END IF;
END $$;

-- Fix notifications table — standardize on 'read' column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- If notifications has 'is_read', migrate it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    UPDATE notifications SET read = is_read WHERE read IS NULL OR read = false;
    ALTER TABLE notifications DROP COLUMN IF EXISTS is_read;
  END IF;
END $$;

-- Fix location_tracking — add is_active if missing
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add booking_id to location_tracking if it's UUID type but bookings.id is TEXT
-- (just ensure it's TEXT to match)
-- This is a no-op if already correct

-- Verify
SELECT 
  column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;
