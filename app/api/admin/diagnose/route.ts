import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to check database state
 * Returns information about tables, columns, and data
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Server not configured',
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    // Check braider_profiles table
    const { data: braiders, error: braidersError } = await supabase
      .from('braider_profiles')
      .select('*')
      .limit(1);

    // Count records
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: braiderCount } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      database: {
        profiles: {
          exists: !profilesError,
          error: profilesError?.message,
          count: profileCount,
          sampleColumns: profiles ? Object.keys(profiles[0] || {}) : [],
        },
        braider_profiles: {
          exists: !braidersError,
          error: braidersError?.message,
          count: braiderCount,
          sampleColumns: braiders ? Object.keys(braiders[0] || {}) : [],
        },
      },
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
