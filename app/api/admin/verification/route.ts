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

    // Build query
    let query = supabase
      .from('braider_verification')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: verifications, error } = await query;

    if (error) {
      throw error;
    }

    // Get stats
    const { count: totalPending } = await supabase
      .from('braider_verification')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: totalApproved } = await supabase
      .from('braider_verification')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: totalRejected } = await supabase
      .from('braider_verification')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    return NextResponse.json({
      verifications: verifications || [],
      count: verifications?.length || 0,
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
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}
