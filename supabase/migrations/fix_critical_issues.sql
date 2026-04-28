-- CRITICAL FIXES FOR 4 PRODUCTION ISSUES
-- Run this migration to fix chat, marketplace, and status features

-- ============================================================================
-- ISSUE 1: FIX CONVERSATIONS TABLE SCHEMA
-- ============================================================================

-- Add missing columns to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS braider_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_braider_id ON conversations(braider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

-- ============================================================================
-- ISSUE 2: FIX MESSAGES TABLE SCHEMA
-- ============================================================================

-- Add missing columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'customer';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================================================
-- ISSUE 3: FIX MARKETPLACE PRODUCTS TABLE
-- ============================================================================

-- Ensure marketplace_products table has all required columns
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'NG';
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS location_state TEXT;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT 0;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Create indexes for marketplace queries
CREATE INDEX IF NOT EXISTS idx_marketplace_products_braider_id ON marketplace_products(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_country_code ON marketplace_products(country_code);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_location_state ON marketplace_products(location_state);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_created_at ON marketplace_products(created_at);

-- ============================================================================
-- ISSUE 4: CREATE BRAIDER STATUS TABLES
-- ============================================================================

-- Create braider_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS braider_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  view_count INTEGER DEFAULT 0
);

-- Create status_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS status_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id UUID NOT NULL REFERENCES braider_status(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for status tables
CREATE INDEX IF NOT EXISTS idx_braider_status_braider_id ON braider_status(braider_id);
CREATE INDEX IF NOT EXISTS idx_braider_status_expires_at ON braider_status(expires_at);
CREATE INDEX IF NOT EXISTS idx_status_views_status_id ON status_views(status_id);
CREATE INDEX IF NOT EXISTS idx_status_views_viewer_id ON status_views(viewer_id);

-- ============================================================================
-- ISSUE 5: ADD COUNTRY FIELDS TO BOOKINGS TABLE
-- ============================================================================

-- Add country and currency fields to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS braider_country TEXT DEFAULT 'NG';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';

-- Create indexes for booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_braider_country ON bookings(braider_country);
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);

-- ============================================================================
-- DISABLE RLS ON NEW TABLES (if needed)
-- ============================================================================

-- Disable RLS on status tables to allow public access
ALTER TABLE braider_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_views DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON braider_status TO authenticated;
GRANT ALL ON braider_status TO service_role;
GRANT ALL ON status_views TO authenticated;
GRANT ALL ON status_views TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify conversations table schema
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conversations';

-- Verify messages table schema
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages';

-- Verify marketplace_products table has data
-- SELECT COUNT(*) as product_count FROM marketplace_products;

-- Verify braider_status table exists
-- SELECT COUNT(*) as status_count FROM braider_status;

-- Verify status_views table exists
-- SELECT COUNT(*) as view_count FROM status_views;
