-- ============================================================================
-- COMPLETE PROFILES TABLE SCHEMA FIX
-- ============================================================================
-- This migration ensures the profiles table has ALL required columns
-- for the signup flow to work correctly.
-- 
-- The issue: signup/route.ts tries to insert 'country' column which doesn't exist
-- Solution: Add all missing columns to profiles table

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO PROFILES TABLE
-- ============================================================================

-- Country field (required for payment routing - Stripe for US, Paystack for NG)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'NG';

-- Phone fields (for phone-based login and contact)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_country TEXT DEFAULT 'NG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Verification fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- Soft delete fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Payment/currency fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paystack';

-- Normalized phone for lookups
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(20);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_country ON profiles(phone_country);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_normalized ON profiles(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);

-- ============================================================================
-- 3. ENSURE BRAIDER_PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- Country field (must match profiles.country)
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'NG';

-- Location fields
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Professional fields
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS profession_type TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS services TEXT[];

-- Verification/ID fields
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Next of kin fields
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT;

-- Social media fields
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Phone field
ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================================================
-- 4. CREATE INDEXES FOR BRAIDER_PROFILES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_braider_profiles_country ON braider_profiles(country);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_state ON braider_profiles(state);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_city ON braider_profiles(city);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_verified ON braider_profiles(verified);

-- ============================================================================
-- 5. ENSURE PAYMENT TABLES EXIST FOR PHASE 3
-- ============================================================================

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  payment_provider TEXT NOT NULL,
  provider_transaction_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Payment settings table
CREATE TABLE IF NOT EXISTS payment_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  payment_provider TEXT NOT NULL,
  provider_account_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_settings_user_id ON payment_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_settings_country ON payment_settings(country);

-- Payment reconciliation table
CREATE TABLE IF NOT EXISTS payment_reconciliation (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  transaction_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reconciled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_transaction_id ON payment_reconciliation(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_provider_id ON payment_reconciliation(provider_id);

-- ============================================================================
-- 6. ENSURE BRAIDER_VERIFICATION TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS braider_verification (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  full_name TEXT,
  phone TEXT,
  location_country TEXT,
  location_state TEXT,
  location_city TEXT,
  years_experience INTEGER,
  specialization TEXT,
  id_document_type TEXT,
  id_number TEXT,
  id_document_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_braider_verification_user_id ON braider_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_braider_verification_status ON braider_verification(status);

-- ============================================================================
-- 7. ENSURE PHONE_LOGIN_MAPPINGS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS phone_login_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  phone_country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone, phone_country)
);

CREATE INDEX IF NOT EXISTS idx_phone_login_mappings_user_id ON phone_login_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_login_mappings_phone ON phone_login_mappings(phone);

-- ============================================================================
-- 9. ENSURE BARBER_PROFILES TABLE EXISTS (SAME AS BRAIDER_PROFILES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS barber_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending',
  travel_radius_miles INTEGER DEFAULT 10,
  is_mobile BOOLEAN DEFAULT true,
  salon_address TEXT,
  specialties TEXT[] DEFAULT '{}',
  total_earnings DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  country TEXT DEFAULT 'NG',
  state TEXT,
  city TEXT,
  address TEXT,
  specialization TEXT,
  profession_type TEXT,
  services TEXT[],
  verified BOOLEAN DEFAULT false,
  id_type TEXT,
  id_number TEXT,
  id_document_url TEXT,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  next_of_kin_relationship TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barber_profiles_user_id ON barber_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_country ON barber_profiles(country);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_verified ON barber_profiles(verified);

-- ============================================================================
-- 10. MARKETPLACE TABLES (PRODUCTS, ORDERS, CART, REVIEWS)
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

CREATE TABLE IF NOT EXISTS marketplace_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
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

-- ============================================================================
-- 11. MARKETPLACE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_marketplace_products_braider ON marketplace_products(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_customer ON marketplace_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_braider ON marketplace_orders(braider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_customer ON marketplace_cart(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_product ON marketplace_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_wishlist_customer ON marketplace_wishlist(customer_id);

-- ============================================================================
-- 12. ENSURE CONVERSATIONS AND MESSAGES TABLES EXIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2_id ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- ============================================================================
-- 13. ENSURE BRAIDER_STATUS AND BARBER_STATUS TABLES EXIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS braider_status (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_available BOOLEAN DEFAULT false,
  current_location_lat DECIMAL(10,8),
  current_location_lng DECIMAL(11,8),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barber_status (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_available BOOLEAN DEFAULT false,
  current_location_lat DECIMAL(10,8),
  current_location_lng DECIMAL(11,8),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_braider_status_user_id ON braider_status(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_status_user_id ON barber_status(user_id);

-- ============================================================================
-- 14. VERIFY SCHEMA
-- ============================================================================
-- Run these queries to verify all columns exist:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY column_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'braider_profiles' ORDER BY column_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'barber_profiles' ORDER BY column_name;
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
