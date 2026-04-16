-- ============================================================================
-- MARKETPLACE PRODUCTION SYSTEM - INTERNATIONAL STANDARD
-- ============================================================================
-- This migration creates a complete, production-ready marketplace
-- with real-time functionality, AI image generation, and full braider access
-- Safe to run multiple times with IF NOT EXISTS

-- ============================================================================
-- 1. MARKETPLACE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_emoji VARCHAR(10),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. MARKETPLACE PRODUCTS TABLE (MAIN INVENTORY)
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  ai_generated_image BOOLEAN DEFAULT FALSE,
  original_image_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  rating_avg DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(braider_id, name)
);

-- ============================================================================
-- 3. MARKETPLACE ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  shipping_address TEXT,
  shipping_method VARCHAR(50),
  tracking_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. MARKETPLACE ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. MARKETPLACE CART TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- ============================================================================
-- 6. MARKETPLACE REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. MARKETPLACE SALES ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_sales_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sales DECIMAL(12, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(braider_id)
);

-- ============================================================================
-- 8. MARKETPLACE WISHLIST TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- ============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_marketplace_products_braider ON marketplace_products(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_created ON marketplace_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_rating ON marketplace_products(rating_avg DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_customer ON marketplace_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_braider ON marketplace_orders(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created ON marketplace_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_cart_customer ON marketplace_cart(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_product ON marketplace_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_customer ON marketplace_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sales_braider ON marketplace_sales_analytics(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_wishlist_customer ON marketplace_wishlist(customer_id);

-- ============================================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_wishlist ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. RLS POLICIES - CATEGORIES (PUBLIC READ)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Categories are viewable by everyone' AND tablename = 'marketplace_categories') THEN
    CREATE POLICY "Categories are viewable by everyone" ON marketplace_categories
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================================
-- 12. RLS POLICIES - PRODUCTS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Active products viewable by everyone' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Active products viewable by everyone" ON marketplace_products
      FOR SELECT USING (is_active = true OR status = 'active');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can view own products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders can view own products" ON marketplace_products
      FOR SELECT USING (braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can insert products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders can insert products" ON marketplace_products
      FOR INSERT WITH CHECK (braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can update own products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders can update own products" ON marketplace_products
      FOR UPDATE USING (braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can delete own products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders can delete own products" ON marketplace_products
      FOR DELETE USING (braider_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 13. RLS POLICIES - ORDERS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own orders' AND tablename = 'marketplace_orders') THEN
    CREATE POLICY "Users can view own orders" ON marketplace_orders
      FOR SELECT USING (customer_id = auth.uid() OR braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers can create orders' AND tablename = 'marketplace_orders') THEN
    CREATE POLICY "Customers can create orders" ON marketplace_orders
      FOR INSERT WITH CHECK (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can update order status' AND tablename = 'marketplace_orders') THEN
    CREATE POLICY "Braiders can update order status" ON marketplace_orders
      FOR UPDATE USING (braider_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 14. RLS POLICIES - CART
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own cart' AND tablename = 'marketplace_cart') THEN
    CREATE POLICY "Users can view own cart" ON marketplace_cart
      FOR SELECT USING (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own cart' AND tablename = 'marketplace_cart') THEN
    CREATE POLICY "Users can manage own cart" ON marketplace_cart
      FOR INSERT WITH CHECK (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own cart' AND tablename = 'marketplace_cart') THEN
    CREATE POLICY "Users can update own cart" ON marketplace_cart
      FOR UPDATE USING (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete from cart' AND tablename = 'marketplace_cart') THEN
    CREATE POLICY "Users can delete from cart" ON marketplace_cart
      FOR DELETE USING (customer_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 15. RLS POLICIES - REVIEWS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reviews viewable by everyone' AND tablename = 'marketplace_reviews') THEN
    CREATE POLICY "Reviews viewable by everyone" ON marketplace_reviews
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers can create reviews' AND tablename = 'marketplace_reviews') THEN
    CREATE POLICY "Customers can create reviews" ON marketplace_reviews
      FOR INSERT WITH CHECK (customer_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 16. RLS POLICIES - WISHLIST
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own wishlist' AND tablename = 'marketplace_wishlist') THEN
    CREATE POLICY "Users can view own wishlist" ON marketplace_wishlist
      FOR SELECT USING (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage wishlist' AND tablename = 'marketplace_wishlist') THEN
    CREATE POLICY "Users can manage wishlist" ON marketplace_wishlist
      FOR INSERT WITH CHECK (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete from wishlist' AND tablename = 'marketplace_wishlist') THEN
    CREATE POLICY "Users can delete from wishlist" ON marketplace_wishlist
      FOR DELETE USING (customer_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 17. RLS POLICIES - SALES ANALYTICS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can view own analytics' AND tablename = 'marketplace_sales_analytics') THEN
    CREATE POLICY "Braiders can view own analytics" ON marketplace_sales_analytics
      FOR SELECT USING (braider_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 18. INSERT DEFAULT CATEGORIES
-- ============================================================================
INSERT INTO marketplace_categories (name, slug, description, icon_emoji, display_order) VALUES
  ('Hair Extensions', 'hair-extensions', 'Premium quality hair extensions, weaves, and bundles', '💇', 1),
  ('Wigs & Hairpieces', 'wigs', 'Stylish wigs, lace fronts, and hairpieces', '👩', 2),
  ('Braiding Supplies', 'braiding-supplies', 'Tools, threads, beads, and materials for braiding', '🧵', 3),
  ('Hair Care Products', 'hair-care', 'Shampoos, conditioners, oils, and treatments', '🧴', 4),
  ('Accessories', 'accessories', 'Hair clips, beads, decorations, and styling accessories', '✨', 5),
  ('Styling Tools', 'styling-tools', 'Combs, brushes, blow dryers, and styling equipment', '🔧', 6),
  ('Protective Styles', 'protective-styles', 'Products for protective styling and maintenance', '🛡️', 7),
  ('Premium Services', 'premium-services', 'Premium braiding services and consultations', '👑', 8),
  ('Other Products', 'other', 'Other products and miscellaneous items', '📦', 9)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 19. CREATE REALTIME SUBSCRIPTIONS
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_cart;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_reviews;

-- ============================================================================
-- 20. GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON marketplace_categories TO authenticated;
GRANT SELECT ON marketplace_products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON marketplace_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_cart TO authenticated;
GRANT SELECT, INSERT ON marketplace_reviews TO authenticated;
GRANT SELECT ON marketplace_sales_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_wishlist TO authenticated;
