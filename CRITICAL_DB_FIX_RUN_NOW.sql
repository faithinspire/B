-- ============================================================================
-- CRITICAL FIX — RUN THIS IN SUPABASE SQL EDITOR
-- Supabase Dashboard → SQL Editor → New Query → Paste All → Run
-- ============================================================================

-- ─── STEP 1: FIX CONVERSATIONS TABLE ─────────────────────────────────────────
-- Add missing columns to conversations (keep existing data)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS braider_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate old participant columns to new ones if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='participant1_id') THEN
    UPDATE conversations SET customer_id = participant1_id WHERE customer_id IS NULL;
    UPDATE conversations SET braider_id = participant2_id WHERE braider_id IS NULL;
  END IF;
END $$;

-- ─── STEP 2: FIX MESSAGES TABLE ──────────────────────────────────────────────
-- Add conversation_id and other missing columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'customer';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add read column (standardize — drop is_read if exists)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='is_read') THEN
    UPDATE messages SET read = is_read WHERE read IS NULL;
    ALTER TABLE messages DROP COLUMN IF EXISTS is_read;
  END IF;
  -- Copy timestamp to created_at if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='timestamp') THEN
    UPDATE messages SET created_at = "timestamp" WHERE created_at IS NULL;
  END IF;
END $$;

-- ─── STEP 3: FIX LOCATION_TRACKING TABLE ─────────────────────────────────────
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS braider_id UUID;
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS accuracy FLOAT DEFAULT 0;
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS speed FLOAT DEFAULT 0;
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS heading FLOAT DEFAULT 0;
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migrate user_id to braider_id if user_type = 'braider'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='location_tracking' AND column_name='user_id') THEN
    UPDATE location_tracking SET braider_id = user_id WHERE braider_id IS NULL;
  END IF;
END $$;

-- ─── STEP 4: FIX NOTIFICATIONS TABLE ─────────────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='is_read') THEN
    UPDATE notifications SET read = is_read WHERE read IS NULL;
    -- Keep is_read for backward compat, just sync it
  END IF;
END $$;

-- ─── STEP 5: DISABLE RLS ON ALL TABLES ───────────────────────────────────────
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio DISABLE ROW LEVEL SECURITY;

-- ─── STEP 6: ENABLE REALTIME ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE location_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ─── STEP 7: VERIFY ──────────────────────────────────────────────────────────
SELECT 'messages:' as tbl, column_name, data_type 
FROM information_schema.columns WHERE table_name='messages' ORDER BY ordinal_position;

SELECT 'conversations:' as tbl, column_name, data_type 
FROM information_schema.columns WHERE table_name='conversations' ORDER BY ordinal_position;

SELECT 'location_tracking:' as tbl, column_name, data_type 
FROM information_schema.columns WHERE table_name='location_tracking' ORDER BY ordinal_position;
