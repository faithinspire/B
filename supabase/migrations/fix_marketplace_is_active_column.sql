-- ============================================================================
-- MARKETPLACE FIX - ADD is_active COLUMN IF NOT EXISTS
-- ============================================================================
-- This migration PERMANENTLY fixes the "column is_active does not exist" error
-- by adding the column to the existing marketplace_products table

-- Check if marketplace_products table exists, if not create it
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

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE marketplace_products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_products' AND column_name = 'status'
  ) THEN
    ALTER TABLE marketplace_products ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
END $$;

-- Add rating columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_products' AND column_name = 'rating_avg'
  ) THEN
    ALTER TABLE marketplace_products ADD COLUMN rating_avg DECIMAL(3, 2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_products' AND column_name = 'rating_count'
  ) THEN
    ALTER TABLE marketplace_products ADD COLUMN rating_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_products' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE marketplace_products ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create other marketplace tables if they don't exist
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

CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

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

CREATE TABLE IF NOT EXISTS marketplace_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_products_braider ON marketplace_products(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_customer ON marketplace_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_braider ON marketplace_orders(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_customer ON marketplace_cart(customer_id);

-- Enable RLS
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Active products viewable' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Active products viewable" ON marketplace_products FOR SELECT USING (is_active = true OR status = 'active');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders insert products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders insert products" ON marketplace_products FOR INSERT WITH CHECK (braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders update products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders update products" ON marketplace_products FOR UPDATE USING (braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders delete products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders delete products" ON marketplace_products FOR DELETE USING (braider_id = auth.uid());
  END IF;
END $$;

-- Insert default categories
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

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_cart;
