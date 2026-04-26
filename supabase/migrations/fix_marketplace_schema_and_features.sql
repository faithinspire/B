-- Fix Marketplace Schema and Add Missing Columns
-- This migration adds missing columns and creates new feature tables

-- 1. Add braider_id to marketplace_orders (for seller reference)
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS braider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_braider ON marketplace_orders(braider_id);

-- 2. Create braider_status table for 24-hour status/stories
CREATE TABLE IF NOT EXISTS braider_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  view_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_braider_status_braider ON braider_status(braider_id);
CREATE INDEX IF NOT EXISTS idx_braider_status_expires ON braider_status(expires_at);

-- 3. Create followers table for following system
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

-- 4. Create status_views table to track who viewed status
CREATE TABLE IF NOT EXISTS status_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status_id UUID NOT NULL REFERENCES braider_status(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(status_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_status_views_status ON status_views(status_id);
CREATE INDEX IF NOT EXISTS idx_status_views_viewer ON status_views(viewer_id);

-- 5. Enable RLS on new tables
ALTER TABLE braider_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_views ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for braider_status
CREATE POLICY "Braiders can create own status" ON braider_status FOR INSERT WITH CHECK (auth.uid() = braider_id);
CREATE POLICY "Braiders can update own status" ON braider_status FOR UPDATE USING (auth.uid() = braider_id);
CREATE POLICY "Braiders can delete own status" ON braider_status FOR DELETE USING (auth.uid() = braider_id);
CREATE POLICY "Anyone can view non-expired status" ON braider_status FOR SELECT USING (expires_at > NOW());

-- 7. RLS Policies for followers
CREATE POLICY "Users can follow anyone" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (auth.uid() = follower_id);
CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);

-- 8. RLS Policies for status_views
CREATE POLICY "Users can view status views" ON status_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Braiders can see who viewed their status" ON status_views FOR SELECT USING (auth.uid() IN (SELECT braider_id FROM braider_status WHERE id = status_id));

-- 9. Add payment_method column to marketplace_orders
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe'; -- 'stripe', 'paystack', 'transfer'

-- 10. Add seller_country to marketplace_orders for payment routing
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS seller_country TEXT DEFAULT 'NG';

-- 11. Update marketplace_orders RLS to include braider_id
DROP POLICY IF EXISTS "Sellers can read own orders" ON marketplace_orders;
CREATE POLICY "Sellers can read own orders" ON marketplace_orders FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = braider_id);

-- 12. Add status limit tracking (max 3 per braider)
CREATE TABLE IF NOT EXISTS braider_status_limit (
  braider_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status_count INTEGER DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Cleanup expired status automatically (trigger)
CREATE OR REPLACE FUNCTION cleanup_expired_status()
RETURNS void AS $$
BEGIN
  DELETE FROM braider_status WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 14. Update marketplace_orders to set braider_id from seller_id if not set
UPDATE marketplace_orders SET braider_id = seller_id WHERE braider_id IS NULL;

-- 15. Make braider_id NOT NULL after migration
ALTER TABLE marketplace_orders ALTER COLUMN braider_id SET NOT NULL;
