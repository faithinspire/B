import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Get braider_profiles
    let query = supabase
      .from('braider_profiles')
      .select('id, user_id, bio, verification_status, is_active, created_at, rating_avg, rating_count')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }

    const { data: braiderProfiles, error: braiderError } = await query;

    if (braiderError) {
      console.error('Braider profiles error:', braiderError);
      return NextResponse.json({ success: false, error: braiderError.message }, { status: 500 });
    }

    if (!braiderProfiles || braiderProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
      });
    }

    // Get profiles for email/name
    const userIds = braiderProfiles.map(b => b.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, avatar_url')
      .in('id', userIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

    // Merge data
    const braiders = braiderProfiles.map(bp => {
      const profile = profileMap[bp.user_id] || {};
      return {
        id: bp.id,
        user_id: bp.user_id,
        email: (profile as any).email || 'N/A',
        full_name: (profile as any).full_name || 'Unknown',
        phone: (profile as any).phone || '',
        avatar_url: (profile as any).avatar_url || null,
        bio: bp.bio || '',
        verification_status: bp.verification_status || 'pending',
        is_active: bp.is_active,
        rating_avg: bp.rating_avg || 0,
        rating_count: bp.rating_count || 0,
        created_at: bp.created_at,
      };
    });

    // Stats - count all regardless of filter
    const { count: pending } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    const { count: approved } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'approved');

    const { count: rejected } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'rejected');

    const { count: unverified } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'unverified');

    return NextResponse.json({
      success: true,
      data: braiders,
      stats: {
        pending: pending || 0,
        approved: approved || 0,
        rejected: rejected || 0,
        unverified: unverified || 0,
        total: (pending || 0) + (approved || 0) + (rejected || 0) + (unverified || 0),
      },
    });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
