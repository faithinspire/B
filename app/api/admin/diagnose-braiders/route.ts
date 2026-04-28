import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * DIAGNOSTIC ENDPOINT
 * Check why braiders aren't showing
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Check 1: Count all braider_profiles
    const { data: allBraiders, error: countError } = await serviceSupabase
      .from('braider_profiles')
      .select('id, user_id, full_name, country, profession_type, verification_status', { count: 'exact' });

    // Check 2: Count by country
    const { data: ngBraiders } = await serviceSupabase
      .from('braider_profiles')
      .select('id', { count: 'exact' })
      .eq('country', 'NG');

    const { data: usBraiders } = await serviceSupabase
      .from('braider_profiles')
      .select('id', { count: 'exact' })
      .eq('country', 'US');

    // Check 3: Count by profession
    const { data: braiders } = await serviceSupabase
      .from('braider_profiles')
      .select('id', { count: 'exact' })
      .neq('profession_type', 'barber');

    const { data: barbers } = await serviceSupabase
      .from('braider_profiles')
      .select('id', { count: 'exact' })
      .eq('profession_type', 'barber');

    // Check 4: Sample data
    const { data: sample } = await serviceSupabase
      .from('braider_profiles')
      .select('*')
      .limit(5);

    return NextResponse.json({
      status: 'diagnostic',
      totals: {
        all_braiders: allBraiders?.length || 0,
        ng_braiders: ngBraiders?.length || 0,
        us_braiders: usBraiders?.length || 0,
        braiders_count: braiders?.length || 0,
        barbers_count: barbers?.length || 0,
      },
      sample_data: sample || [],
      errors: {
        count_error: countError?.message,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
