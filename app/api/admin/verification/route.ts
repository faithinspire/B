import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase not configured');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    console.log('=== VERIFICATION API: Starting fetch ===');

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '0');
    const limit = 50;
    const offset = page * limit;

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
        state,
        city,
        address,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by verification status - only pending by default
    if (status === 'all') {
      // Get all braiders
      console.log('=== VERIFICATION API: Fetching all braiders ===');
    } else {
      query = query.eq('verification_status', status);
      console.log(`=== VERIFICATION API: Filtering by status: ${status} ===`);
    }

    const { data: braiderProfiles, error: profilesError, count: totalCount } = await query;

    if (profilesError) {
      console.error('=== VERIFICATION API: Braider profiles query error ===', profilesError);
      throw profilesError;
    }

    console.log(`=== VERIFICATION API: Got ${braiderProfiles?.length || 0} braider profiles ===`);

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

    const braiders = (braiderProfiles || []).map(bp => ({
      id: bp.id,
      user_id: bp.user_id,
      email: bp.email || '',
      full_name: bp.full_name || '',
      phone: bp.phone || '',
      bio: bp.bio || '',
      specialization: bp.specialization || '',
      verification_status: bp.verification_status || 'pending',
      state: bp.state || '',
      city: bp.city || '',
      address: bp.address || '',
      created_at: bp.created_at,
      updated_at: bp.updated_at,
    }));

    const stats = {
      total: (totalPending || 0) + (totalApproved || 0) + (totalRejected || 0),
      pending: totalPending || 0,
      approved: totalApproved || 0,
      rejected: totalRejected || 0,
    };

    console.log('=== VERIFICATION API: Final stats ===', stats);
    console.log(`=== VERIFICATION API: Returning ${braiders.length} braiders ===`);

    return NextResponse.json({
      braiders,
      count: braiders.length,
      stats,
    });
  } catch (error) {
    console.error('=== VERIFICATION API: Error ===', error);
    return NextResponse.json(
      { error: 'Failed to fetch verifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
