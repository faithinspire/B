-- ============================================================================
-- FIX MESSAGING, NOTIFICATIONS, AND LOCATION TABLES
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ── conversations table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT,
  customer_id UUID,
  braider_id UUID,
  admin_id UUID,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS braider_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ── messages table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT,
  sender_id UUID,
  sender_role TEXT DEFAULT 'customer',
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'customer';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ── notifications table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  booking_id TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- ── location_tracking table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_tracking (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  braider_id UUID NOT NULL,
  booking_id TEXT,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  heading DECIMAL(5,2),
  speed DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10,2);
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS heading DECIMAL(5,2);
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS speed DECIMAL(10,2);
ALTER TABLE location_tracking ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ── Disable RLS on all messaging tables ──────────────────────────────────
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking DISABLE ROW LEVEL SECURITY;

-- ── Grant permissions ─────────────────────────────────────────────────────
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversations TO anon;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO anon;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO anon;
GRANT ALL ON location_tracking TO authenticated;
GRANT ALL ON location_tracking TO anon;

-- ── Enable realtime on key tables ─────────────────────────────────────────
-- Run these in Supabase Dashboard → Database → Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE location_tracking;

-- ============================================================================
-- DONE: All messaging and notification tables ready
-- ============================================================================
