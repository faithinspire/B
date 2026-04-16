import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Setup braider schema - adds missing columns to braider_profiles
 * This is a one-time setup endpoint
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

    const results = [];

    // 1. Add missing columns to braider_profiles
    const columnsToAdd = [
      { name: 'phone', type: 'TEXT' },
      { name: 'specialization', type: 'TEXT' },
      { name: 'services', type: "TEXT[] DEFAULT '{}'" },
      { name: 'state', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'verified', type: 'BOOLEAN DEFAULT false' },
      { name: 'next_of_kin_name', type: 'TEXT' },
      { name: 'next_of_kin_phone', type: 'TEXT' },
      { name: 'next_of_kin_relationship', type: 'TEXT' },
      { name: 'id_type', type: 'TEXT' },
      { name: 'id_number', type: 'TEXT' },
      { name: 'id_document_url', type: 'TEXT' },
    ];

    for (const col of columnsToAdd) {
      try {
        // Check if column exists by trying to select it
        const { error: checkError } = await supabase
          .from('braider_profiles')
          .select(col.name)
          .limit(1);

        // If column doesn't exist, we'll get an error, so we try to add it
        if (checkError && checkError.message.includes('column')) {
          // Column doesn't exist, try to add it
          // Note: We can't directly execute ALTER TABLE through the client
          // So we'll just track that it needs to be added
          results.push({
            column: col.name,
            status: 'needs_migration',
            message: 'Column needs to be added via Supabase SQL editor'
          });
        } else {
          results.push({
            column: col.name,
            status: 'exists',
            message: 'Column already exists'
          });
        }
      } catch (err) {
        results.push({
          column: col.name,
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // 2. Check if braider_verification table exists
    try {
      const { error: tableError } = await supabase
        .from('braider_verification')
        .select('id')
        .limit(1);

      if (tableError && tableError.message.includes('does not exist')) {
        results.push({
          table: 'braider_verification',
          status: 'needs_creation',
          message: 'Table needs to be created via Supabase SQL editor'
        });
      } else {
        results.push({
          table: 'braider_verification',
          status: 'exists',
          message: 'Table already exists'
        });
      }
    } catch (err) {
      results.push({
        table: 'braider_verification',
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Schema check completed',
      results,
      instructions: `
        To complete the setup, run the following SQL in your Supabase SQL editor:

        -- Add missing columns to braider_profiles
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS state TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS city TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS address TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_type TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
        ALTER TABLE braider_profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;

        -- Create braider_verification table if it doesn't exist
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

        -- Disable RLS to allow signup
        ALTER TABLE braider_verification DISABLE ROW LEVEL SECURITY;
        ALTER TABLE braider_profiles DISABLE ROW LEVEL SECURITY;
      `
    });
  } catch (error) {
    console.error('Schema setup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
