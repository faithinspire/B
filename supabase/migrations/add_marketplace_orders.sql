CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES marketplace_products(id),
  buyer_id UUID,
  seller_id UUID,
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'NGN',
  delivery_address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, dispatched, delivered, cancelled
  tracking_info TEXT,
  dispatch_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order messages for seller/buyer communication about dispatch
CREATE TABLE IF NOT EXISTS marketplace_order_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES marketplace_orders(id),
  sender_id UUID,
  sender_role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
