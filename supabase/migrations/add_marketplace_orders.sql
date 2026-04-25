-- Marketplace Orders Table with proper foreign keys
DROP TABLE IF EXISTS marketplace_order_messages CASCADE;
DROP TABLE IF EXISTS marketplace_orders CASCADE;

CREATE TABLE marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_email TEXT DEFAULT '',
  buyer_name TEXT DEFAULT '',
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT DEFAULT '',
  product_image TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  delivery_address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  tracking_info TEXT,
  dispatch_notes TEXT,
  paystack_reference TEXT,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order messages for buyer-seller dispatch discussion
CREATE TABLE marketplace_order_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT DEFAULT 'customer',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_order_messages_order ON marketplace_order_messages(order_id);
CREATE INDEX idx_marketplace_order_messages_sender ON marketplace_order_messages(sender_id);

-- Enable RLS
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Buyers can read own orders" ON marketplace_orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can read own orders" ON marketplace_orders FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can insert orders" ON marketplace_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update order status" ON marketplace_orders FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can read order messages" ON marketplace_order_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() IN (SELECT buyer_id FROM marketplace_orders WHERE id = order_id) OR auth.uid() IN (SELECT seller_id FROM marketplace_orders WHERE id = order_id));
CREATE POLICY "Users can insert order messages" ON marketplace_order_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Add columns to bookings if not exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS braider_country TEXT DEFAULT 'NG';
