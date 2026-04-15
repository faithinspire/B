import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Skip auth check for now - service role key is sufficient
    // The service role key is only available server-side

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Query braider_profiles table (source of truth for braider data)
    let query = supabase
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
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // Filter by verification status
    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }

    const { data: braiderProfiles, error: profilesError } = await query;

    if (profilesError) {
      console.error('Braider profiles query error:', profilesError);
      throw profilesError;
    }

    // Get stats for all verification statuses
    const { count: totalPending } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    const { count: totalApproved } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'approved');

    const { count: totalRejected } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'rejected');

    const { count: totalUnverified } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'unverified');

    const braiders = braiderProfiles || [];

    return NextResponse.json({
      braiders: braiders,
      count: braiders.length,
      stats: {
        pending: totalPending || 0,
        approved: totalApproved || 0,
        rejected: totalRejected || 0,
        unverified: totalUnverified || 0,
        total: (totalPending || 0) + (totalApproved || 0) + (totalRejected || 0) + (totalUnverified || 0),
      },
    });
  } catch (error) {
    console.error('Verification list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
