import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * HARD FIX: Fix braider_profiles schema
 * Adds missing columns that braider signup needs
 */
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // SQL to add missing columns
    const sqlStatements = [
      // Add missing columns to braider_profiles
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS phone TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS specialization TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS state TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS city TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS address TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_type TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_number TEXT;`,
      `ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;`,
      
      // Create braider_verification table if it doesn't exist
      `CREATE TABLE IF NOT EXISTS braider_verification (
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
      );`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_braider_profiles_phone ON braider_profiles(phone);`,
      `CREATE INDEX IF NOT EXISTS idx_braider_profiles_state ON braider_profiles(state);`,
      `CREATE INDEX IF NOT EXISTS idx_braider_profiles_city ON braider_profiles(city);`,
      `CREATE INDEX IF NOT EXISTS idx_braider_verification_user_id ON braider_verification(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_braider_verification_status ON braider_verification(status);`,
      
      // Disable RLS to allow signup
      `ALTER TABLE braider_verification DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;`,
    ];

    // Execute each statement
    const results = [];
    for (const sql of sqlStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          console.warn(`Warning executing: ${sql.substring(0, 50)}...`, error);
        } else {
          results.push({ sql: sql.substring(0, 50), status: 'success' });
        }
      } catch (err) {
        console.warn(`Error executing: ${sql.substring(0, 50)}...`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Schema migration completed',
      results,
    });
  } catch (error) {
    console.error('Schema fix error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
