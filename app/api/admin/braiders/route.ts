import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // UNIFIED SOURCE: Query braider_profiles (single source of truth for braiders)
    const { data: braiders, error } = await supabaseAdmin
      .from('braider_profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        phone,
        bio,
        specialization,
        verification_status,
        state,
        city,
        address,
        avatar_url,
        experience_years,
        rating_avg,
        rating_count,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching braiders:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch braiders', details: error.message },
        { status: 500 }
      );
    }

    // Get stats
    const { count: total } = await supabaseAdmin
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: pending } = await supabaseAdmin
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    const { count: approved } = await supabaseAdmin
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'approved');

    const { count: rejected } = await supabaseAdmin
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'rejected');

    return NextResponse.json({
      success: true,
      data: braiders || [],
      stats: {
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        rejected: rejected || 0,
      },
    });
  } catch (err) {
    console.error('Braiders API error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
