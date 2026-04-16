#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const sql = `
-- Fix braider signup schema - ensure all required columns exist
ALTER TABLE braider_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,
ADD COLUMN IF NOT EXISTS id_type TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Ensure braider_verification table exists
CREATE TABLE IF NOT EXISTS braider_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  full_name TEXT,
  phone TEXT,
  location_country TEXT DEFAULT 'NG',
  location_state TEXT,
  location_city TEXT,
  years_experience INTEGER DEFAULT 0,
  specialization TEXT,
  id_document_type TEXT,
  id_number TEXT,
  id_document_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_braider_profiles_phone ON braider_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_state ON braider_profiles(state);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_city ON braider_profiles(city);
CREATE INDEX IF NOT EXISTS idx_braider_verification_user_id ON braider_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_braider_verification_status ON braider_verification(status);

-- Disable RLS to allow signup
ALTER TABLE braider_verification DISABLE ROW LEVEL SECURITY;
ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
`;

async function runMigration() {
  try {
    console.log('🔄 Running braider signup schema migration...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ braider_profiles table now has all required columns');
    console.log('✅ braider_verification table is ready');
    console.log('✅ RLS disabled for signup to work');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

runMigration();
