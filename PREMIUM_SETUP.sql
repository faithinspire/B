-- ============================================================
-- PREMIUM BRAIDER SYSTEM — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add premium columns to braider_profiles
ALTER TABLE braider_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS premium_plan TEXT DEFAULT 'monthly', -- 'monthly' | 'annual'
  ADD COLUMN IF NOT EXISTS blog_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order INT DEFAULT 0;

-- 2. Blog posts table for premium braiders
CREATE TABLE IF NOT EXISTS braider_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(braider_id, slug)
);

-- 3. Premium subscriptions audit table
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'monthly',
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active | cancelled | past_due
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Index for fast premium braider queries
CREATE INDEX IF NOT EXISTS idx_braider_profiles_premium ON braider_profiles(is_premium, featured_order DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_braider ON braider_blog_posts(braider_id, published);

-- 5. Disable RLS on new tables
ALTER TABLE braider_blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions DISABLE ROW LEVEL SECURITY;

SELECT 'Premium tables created successfully' AS status;
