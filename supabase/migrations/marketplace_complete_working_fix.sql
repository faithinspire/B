-- ============================================================================
-- MARKETPLACE COMPLETE WORKING FIX - NO RLS, NO STORAGE POLICIES
-- ============================================================================
-- This migration creates marketplace tables WITHOUT RLS complications
-- Storage is handled via API endpoint with service role key

-- ============================================================================
-- STEP 1: DROP OLD TABLES (if they exist)
-- ============================================================================
DROP TABLE IF EXISTS marketplace_wishlist CASCADE;
DROP TABLE IF EXISTS marketplace_reviews CASCADE;
DROP TABLE IF EXISTS marketplace_sales_analytics CASCADE;
DROP TABLE IF EXISTS marketplace_order_items CASCADE;
DROP TABLE IF EXISTS marketplace_orders CASCADE;
DROP TABLE IF EXISTS marketplace_cart CASCADE;
DROP TABLE IF EXISTS marketplace_products CASCADE;
DROP TABLE IF EXISTS marketplace_categories CASCADE;

-- ============================================================================
-- STEP 2: CREATE MARKETPLACE PRODUCTS TABLE
-- ============================================================================
CREATE TABLE marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  country_code VARCHAR(2) DEFAULT 'NG',
  location_state VARCHAR(100),
  location_city VARCHAR(100),
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
-- STEP 3: CREATE MARKETPLACE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE marketplace_categories (
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
-- STEP 4: CREATE MARKETPLACE ORDERS TABLE
-- ============================================================================
CREATE TABLE marketplace_orders (
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
-- STEP 5: CREATE MARKETPLACE ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: CREATE MARKETPLACE CART TABLE
-- ============================================================================
CREATE TABLE marketplace_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- ============================================================================
-- STEP 7: CREATE MARKETPLACE REVIEWS TABLE
-- ============================================================================
CREATE TABLE marketplace_reviews (
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
-- STEP 8: CREATE MARKETPLACE SALES ANALYTICS TABLE
-- ============================================================================
CREATE TABLE marketplace_sales_analytics (
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
-- STEP 9: CREATE MARKETPLACE WISHLIST TABLE
-- ============================================================================
CREATE TABLE marketplace_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- ============================================================================
-- STEP 10: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_marketplace_products_braider ON marketplace_products(braider_id);
CREATE INDEX idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX idx_marketplace_products_country ON marketplace_products(country_code);
CREATE INDEX idx_marketplace_products_state ON marketplace_products(location_state);
CREATE INDEX idx_marketplace_orders_customer ON marketplace_orders(customer_id);
CREATE INDEX idx_marketplace_orders_braider ON marketplace_orders(braider_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_cart_customer ON marketplace_cart(customer_id);
CREATE INDEX idx_marketplace_reviews_product ON marketplace_reviews(product_id);
CREATE INDEX idx_marketplace_reviews_customer ON marketplace_reviews(customer_id);

-- ============================================================================
-- STEP 11: DISABLE RLS ON ALL TABLES (Simplest approach)
-- ============================================================================
ALTER TABLE marketplace_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_cart DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sales_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_categories DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 12: GRANT PERMISSIONS TO ALL AUTHENTICATED USERS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_cart TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_wishlist TO authenticated;
GRANT SELECT ON marketplace_categories TO authenticated;
GRANT SELECT ON marketplace_sales_analytics TO authenticated;

-- ============================================================================
-- STEP 13: INSERT DEFAULT CATEGORIES
-- ============================================================================
INSERT INTO marketplace_categories (name, slug, description, icon_emoji, display_order) VALUES
  ('Hair Extensions', 'hair-extensions', 'Premium quality hair extensions', '💇', 1),
  ('Wigs & Hairpieces', 'wigs', 'Stylish wigs and hairpieces', '👩', 2),
  ('Braiding Supplies', 'braiding-supplies', 'Tools and materials for braiding', '🧵', 3),
  ('Hair Care Products', 'hair-care', 'Shampoos, conditioners, and treatments', '🧴', 4),
  ('Accessories', 'accessories', 'Hair clips, beads, and decorations', '✨', 5),
  ('Styling Tools', 'styling-tools', 'Combs, brushes, and styling equipment', '🔧', 6),
  ('Protective Styles', 'protective-styles', 'Products for protective styling', '🛡️', 7),
  ('Premium Services', 'premium-services', 'Premium braiding services', '👑', 8),
  ('Other Products', 'other', 'Other products and items', '📦', 9)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 14: ENABLE REAL-TIME SUBSCRIPTIONS
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_cart;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_reviews;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All marketplace tables created and ready to use
-- ✅ No RLS complications
-- ✅ All authenticated users can access
-- ✅ 9 default categories inserted
-- ✅ Real-time subscriptions enabled
-- ✅ Performance indexes created

