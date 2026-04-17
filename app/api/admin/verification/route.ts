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
      .select('id, user_id, bio, verification_status, profile_approved, is_active, created_at, rating_avg, rating_count')
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

    // Merge data - map enum values to display-friendly statuses
    const braiders = braiderProfiles.map(bp => {
      const profile = profileMap[bp.user_id] || {};
      
      // Map enum verification_status to display status
      let displayStatus = bp.verification_status || 'unverified';
      if (bp.verification_status === 'tier1_verified' || 
          bp.verification_status === 'tier2_verified' || 
          bp.verification_status === 'safety_badge_pro' ||
          bp.profile_approved === true) {
        displayStatus = 'approved';
      } else if (bp.verification_status === 'tier1_pending' || 
                 bp.verification_status === 'tier2_pending') {
        displayStatus = 'pending';
      } else if (bp.verification_status === 'unverified') {
        displayStatus = 'unverified';
      }
      // If column was altered to text, 'approved'/'rejected' pass through directly
      
      return {
        id: bp.id,
        user_id: bp.user_id,
        email: (profile as any).email || 'N/A',
        full_name: (profile as any).full_name || 'Unknown',
        phone: (profile as any).phone || '',
        avatar_url: (profile as any).avatar_url || null,
        bio: bp.bio || '',
        verification_status: displayStatus,
        raw_verification_status: bp.verification_status,
        profile_approved: bp.profile_approved,
        is_active: bp.is_active,
        rating_avg: bp.rating_avg || 0,
        rating_count: bp.rating_count || 0,
        created_at: bp.created_at,
      };
    });

    // Stats - count all regardless of filter
    // Count approved = tier1_verified OR tier2_verified OR safety_badge_pro OR profile_approved=true OR status='approved'
    const { count: approvedCount } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .or('verification_status.eq.tier1_verified,verification_status.eq.tier2_verified,verification_status.eq.safety_badge_pro,verification_status.eq.approved,profile_approved.eq.true');

    const { count: pendingCount } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .or('verification_status.eq.tier1_pending,verification_status.eq.tier2_pending,verification_status.eq.pending');

    const { count: rejectedCount } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .or('verification_status.eq.rejected');

    const { count: unverifiedCount } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'unverified');

    const { count: totalCount } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: braiders,
      stats: {
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        unverified: unverifiedCount || 0,
        total: totalCount || 0,
      },
    });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
