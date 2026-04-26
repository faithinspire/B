-- CRITICAL FIXES FOR ALL 6 BLOCKING ISSUES
-- Run this SQL in Supabase immediately

-- ============================================================================
-- ISSUE #1: Marketplace braider_id error
-- ============================================================================
-- Add braider_id column to marketplace_orders if it doesn't exist
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS braider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_braider ON marketplace_orders(braider_id);

-- Update existing orders to set braider_id from seller_id
UPDATE marketplace_orders SET braider_id = seller_id WHERE braider_id IS NULL;

-- Make braider_id NOT NULL after migration
ALTER TABLE marketplace_orders ALTER COLUMN braider_id SET NOT NULL;

-- ============================================================================
-- ISSUE #5: Payment flow columns
-- ============================================================================
-- Add payment_method column to marketplace_orders
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';

-- Add seller_country column for payment routing
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS seller_country TEXT DEFAULT 'NG';

-- ============================================================================
-- ISSUE #6: Status/Stories & Following
-- ============================================================================

-- Create braider_status table for 24-hour status/stories
CREATE TABLE IF NOT EXISTS braider_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  view_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_braider_status_braider ON braider_status(braider_id);
CREATE INDEX IF NOT EXISTS idx_braider_status_expires ON braider_status(expires_at);

-- Create followers table for following system
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

-- Create status_views table to track who viewed status
CREATE TABLE IF NOT EXISTS status_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status_id UUID NOT NULL REFERENCES braider_status(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(status_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_status_views_status ON status_views(status_id);
CREATE INDEX IF NOT EXISTS idx_status_views_viewer ON status_views(viewer_id);

-- Enable RLS on new tables
ALTER TABLE braider_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for braider_status
DROP POLICY IF EXISTS "Braiders can create own status" ON braider_status;
CREATE POLICY "Braiders can create own status" ON braider_status FOR INSERT WITH CHECK (auth.uid() = braider_id);

DROP POLICY IF EXISTS "Braiders can update own status" ON braider_status;
CREATE POLICY "Braiders can update own status" ON braider_status FOR UPDATE USING (auth.uid() = braider_id);

DROP POLICY IF EXISTS "Braiders can delete own status" ON braider_status;
CREATE POLICY "Braiders can delete own status" ON braider_status FOR DELETE USING (auth.uid() = braider_id);

DROP POLICY IF EXISTS "Anyone can view non-expired status" ON braider_status;
CREATE POLICY "Anyone can view non-expired status" ON braider_status FOR SELECT USING (expires_at > NOW());

-- RLS Policies for followers
DROP POLICY IF EXISTS "Users can follow anyone" ON followers;
CREATE POLICY "Users can follow anyone" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON followers;
CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Anyone can view followers" ON followers;
CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);

-- RLS Policies for status_views
DROP POLICY IF EXISTS "Users can view status views" ON status_views;
CREATE POLICY "Users can view status views" ON status_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Braiders can see who viewed their status" ON status_views;
CREATE POLICY "Braiders can see who viewed their status" ON status_views FOR SELECT USING (auth.uid() IN (SELECT braider_id FROM braider_status WHERE id = status_id));

-- Update marketplace_orders RLS to include braider_id
DROP POLICY IF EXISTS "Sellers can read own orders" ON marketplace_orders;
CREATE POLICY "Sellers can read own orders" ON marketplace_orders FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = braider_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify all fixes are in place:
-- SELECT column_name FROM information_schema.columns WHERE table_name='marketplace_orders' AND column_name='braider_id';
-- SELECT column_name FROM information_schema.columns WHERE table_name='marketplace_orders' AND column_name='payment_method';
-- SELECT column_name FROM information_schema.columns WHERE table_name='marketplace_orders' AND column_name='seller_country';
-- SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='braider_status');
-- SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='followers');
-- SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='status_views');
