-- Marketplace V2 Complete System for BraidMe
-- This migration creates the marketplace tables with the correct schema
-- Safe to run multiple times with IF NOT EXISTS

-- Marketplace Categories Table
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_emoji VARCHAR(10),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace Products Table (Main inventory)
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
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(braider_id, name)
);

-- Marketplace Orders Table
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  shipping_address TEXT,
  shipping_method VARCHAR(50),
  tracking_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items Table (Line items for orders)
CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS marketplace_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales Analytics Table
CREATE TABLE IF NOT EXISTS marketplace_sales_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sales DECIMAL(12, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(braider_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_braider ON marketplace_products(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_customer ON marketplace_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_braider ON marketplace_orders(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_customer ON marketplace_cart(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_product ON marketplace_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_customer ON marketplace_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sales_braider ON marketplace_sales_analytics(braider_id);

-- Enable RLS (Row Level Security)
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sales_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_categories (public read)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Categories are viewable by everyone' AND tablename = 'marketplace_categories') THEN
    CREATE POLICY "Categories are viewable by everyone" ON marketplace_categories
      FOR SELECT USING (true);
  END IF;
END $$;

-- RLS Policies for marketplace_products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Active products are viewable by everyone' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Active products are viewable by everyone" ON marketplace_products
      FOR SELECT USING (is_active = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can view their own products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders can view their own products" ON marketplace_products
      FOR SELECT USING (braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can insert their own products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders can insert their own products" ON marketplace_products
      FOR INSERT WITH CHECK (braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can update their own products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders can update their own products" ON marketplace_products
      FOR UPDATE USING (braider_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can delete their own products' AND tablename = 'marketplace_products') THEN
    CREATE POLICY "Braiders can delete their own products" ON marketplace_products
      FOR DELETE USING (braider_id = auth.uid());
  END IF;
END $$;

-- RLS Policies for marketplace_orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own orders' AND tablename = 'marketplace_orders') THEN
    CREATE POLICY "Users can view their own orders" ON marketplace_orders
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

-- RLS Policies for marketplace_order_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view order items' AND tablename = 'marketplace_order_items') THEN
    CREATE POLICY "Users can view order items" ON marketplace_order_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM marketplace_orders 
          WHERE marketplace_orders.id = marketplace_order_items.order_id 
          AND (marketplace_orders.customer_id = auth.uid() OR marketplace_orders.braider_id = auth.uid())
        )
      );
  END IF;
END $$;

-- RLS Policies for marketplace_cart
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own cart' AND tablename = 'marketplace_cart') THEN
    CREATE POLICY "Users can view their own cart" ON marketplace_cart
      FOR SELECT USING (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own cart' AND tablename = 'marketplace_cart') THEN
    CREATE POLICY "Users can manage their own cart" ON marketplace_cart
      FOR INSERT WITH CHECK (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own cart' AND tablename = 'marketplace_cart') THEN
    CREATE POLICY "Users can update their own cart" ON marketplace_cart
      FOR UPDATE USING (customer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete from their own cart' AND tablename = 'marketplace_cart') THEN
    CREATE POLICY "Users can delete from their own cart" ON marketplace_cart
      FOR DELETE USING (customer_id = auth.uid());
  END IF;
END $$;

-- RLS Policies for marketplace_reviews
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reviews are viewable by everyone' AND tablename = 'marketplace_reviews') THEN
    CREATE POLICY "Reviews are viewable by everyone" ON marketplace_reviews
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers can create reviews' AND tablename = 'marketplace_reviews') THEN
    CREATE POLICY "Customers can create reviews" ON marketplace_reviews
      FOR INSERT WITH CHECK (customer_id = auth.uid());
  END IF;
END $$;

-- RLS Policies for marketplace_sales_analytics
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Braiders can view their own analytics' AND tablename = 'marketplace_sales_analytics') THEN
    CREATE POLICY "Braiders can view their own analytics" ON marketplace_sales_analytics
      FOR SELECT USING (braider_id = auth.uid());
  END IF;
END $$;

-- Insert default categories
INSERT INTO marketplace_categories (name, slug, description, icon_emoji, display_order) VALUES
  ('Hair Extensions', 'hair-extensions', 'Premium hair extensions and weaves', '💇', 1),
  ('Wigs', 'wigs', 'Stylish wigs and hairpieces', '👩', 2),
  ('Braiding Supplies', 'braiding-supplies', 'Tools and materials for braiding', '🧵', 3),
  ('Hair Care', 'hair-care', 'Shampoos, conditioners, and treatments', '🧴', 4),
  ('Accessories', 'accessories', 'Hair clips, beads, and decorations', '✨', 5),
  ('Other', 'other', 'Other products and services', '📦', 6)
ON CONFLICT (name) DO NOTHING;
