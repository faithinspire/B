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

-- Marketplace Products Table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES marketplace_categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'NGN',
  images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
  video_url VARCHAR(500),
  location_country VARCHAR(2) DEFAULT 'NG',
  location_state VARCHAR(100),
  location_city VARCHAR(100),
  quantity_available INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP,
  rating_avg DECIMAL(3, 2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, sold_out
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT valid_quantity CHECK (quantity_available >= 0)
);

-- Marketplace Orders Table
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  braider_id UUID NOT NULL REFERENCES profiles(id),
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  payment_method VARCHAR(50) DEFAULT 'pay_on_delivery',
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(100),
  delivery_country VARCHAR(2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_price CHECK (total_price IS NULL OR total_price >= 0)
);

-- Marketplace Reviews Table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, reviewer_id)
);

-- Marketplace Wishlist Table
CREATE TABLE IF NOT EXISTS marketplace_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX idx_marketplace_products_braider_id ON marketplace_products(braider_id);
CREATE INDEX idx_marketplace_products_category_id ON marketplace_products(category_id);
CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_products_location ON marketplace_products(location_country, location_state, location_city);
CREATE INDEX idx_marketplace_products_featured ON marketplace_products(is_featured, featured_until);
CREATE INDEX idx_marketplace_orders_buyer_id ON marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_braider_id ON marketplace_orders(braider_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_reviews_product_id ON marketplace_reviews(product_id);
CREATE INDEX idx_marketplace_reviews_reviewer_id ON marketplace_reviews(reviewer_id);
CREATE INDEX idx_marketplace_wishlist_user_id ON marketplace_wishlist(user_id);

-- Insert default categories
INSERT INTO marketplace_categories (name, slug, description, icon_emoji, display_order) VALUES
  ('Hair Extensions', 'hair-extensions', 'Premium hair extensions and weaves', '💇', 1),
  ('Wigs', 'wigs', 'Stylish wigs and hairpieces', '👩', 2),
  ('Accessories', 'accessories', 'Hair clips, bands, and accessories', '✨', 3),
  ('Beads & Threads', 'beads-threads', 'Beads, threads, and braiding materials', '🧵', 4),
  ('Tools', 'tools', 'Braiding tools and equipment', '🔧', 5),
  ('Care Products', 'care-products', 'Hair care and maintenance products', '🧴', 6)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_products
CREATE POLICY "Anyone can view active products" ON marketplace_products
  FOR SELECT USING (status = 'active' OR auth.uid() = braider_id);

CREATE POLICY "Braiders can insert their own products" ON marketplace_products
  FOR INSERT WITH CHECK (auth.uid() = braider_id);

CREATE POLICY "Braiders can update their own products" ON marketplace_products
  FOR UPDATE USING (auth.uid() = braider_id);

CREATE POLICY "Braiders can delete their own products" ON marketplace_products
  FOR DELETE USING (auth.uid() = braider_id);

-- RLS Policies for marketplace_orders
CREATE POLICY "Users can view their own orders" ON marketplace_orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = braider_id);

CREATE POLICY "Buyers can create orders" ON marketplace_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Braiders can update order status" ON marketplace_orders
  FOR UPDATE USING (auth.uid() = braider_id);

-- RLS Policies for marketplace_reviews
CREATE POLICY "Anyone can view reviews" ON marketplace_reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can create reviews" ON marketplace_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON marketplace_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- RLS Policies for marketplace_wishlist
CREATE POLICY "Users can manage their own wishlist" ON marketplace_wishlist
  FOR ALL USING (auth.uid() = user_id);
