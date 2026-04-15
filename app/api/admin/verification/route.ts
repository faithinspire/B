import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build query to get braider profiles with verification data
    let query = supabase
      .from('braider_profiles')
      .select(`
        id,
        user_id,
        bio,
        specialization,
        state,
        city,
        address,
        verification_status,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }

    const { data: braiderProfiles, error: profilesError } = await query;

    if (profilesError) {
      throw profilesError;
    }

    // Get user data for these braiders
    const userIds = (braiderProfiles || []).map(bp => bp.user_id);
    
    let userProfiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone')
        .in('id', userIds);

      if (profileError) {
        throw profileError;
      }
      userProfiles = profiles || [];
    }

    // Combine braider and user data
    const braiders = (braiderProfiles || []).map(bp => {
      const userProfile = userProfiles.find(up => up.id === bp.user_id);
      return {
        id: bp.id,
        user_id: bp.user_id,
        email: userProfile?.email || '',
        full_name: userProfile?.full_name || '',
        phone: userProfile?.phone || '',
        bio: bp.bio || '',
        specialization: bp.specialization || '',
        state: bp.state || '',
        city: bp.city || '',
        address: bp.address || '',
        verification_status: bp.verification_status || 'pending',
        created_at: bp.created_at,
        updated_at: bp.updated_at,
      };
    });

    // Get stats
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

    return NextResponse.json({
      braiders: braiders,
      count: braiders.length,
      stats: {
        pending: totalPending || 0,
        approved: totalApproved || 0,
        rejected: totalRejected || 0,
        total: (totalPending || 0) + (totalApproved || 0) + (totalRejected || 0),
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
