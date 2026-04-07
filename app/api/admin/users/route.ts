import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: No auth token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    let userRole = (user.user_metadata as any)?.role;

    if (!userRole || userRole !== 'admin') {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          userRole = profile.role;
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    }

    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Users fetch error:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const userIds = (users?.users || []).map((u: any) => u.id);

    // Fetch profiles
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      try {
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (!profilesError && profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      } catch (err) {
        console.error('Profiles fetch error:', err);
      }
    }

    // Fetch braider profiles with document URLs
    let braiderProfilesMap: Record<string, any> = {};
    try {
      const { data: braiderProfiles, error: braiderError } = await supabaseAdmin
        .from('braider_profiles')
        .select('*');

      if (!braiderError && braiderProfiles) {
        braiderProfilesMap = Object.fromEntries(
          braiderProfiles.map(bp => [bp.user_id, bp])
        );
      }
    } catch (err) {
      console.error('Braider profiles fetch error:', err);
    }

    // Transform users with all details
    const transformedUsers = (users?.users || [])
      .map((u: any) => {
        const profile = profilesMap[u.id];
        const braiderProfile = braiderProfilesMap[u.id];

        return {
          id: u.id,
          email: u.email || '',
          full_name: profile?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
          role: profile?.role || u.user_metadata?.role || 'customer',
          created_at: u.created_at,
          phone: u.phone || profile?.phone || u.user_metadata?.phone || '',
          avatar_url: profile?.avatar_url || null,
          bio: profile?.bio || '',
          
          // Braider-specific fields
          braiderProfile: braiderProfile ? {
            user_id: braiderProfile.user_id,
            phone_number: braiderProfile.phone_number || '',
            next_of_kin_name: braiderProfile.next_of_kin_name || '',
            next_of_kin_phone: braiderProfile.next_of_kin_phone || '',
            next_of_kin_relationship: braiderProfile.next_of_kin_relationship || '',
            id_document_url: braiderProfile.id_document_url || '',
            selfie_url: braiderProfile.selfie_url || '',
            bio: braiderProfile.bio || '',
            rating: braiderProfile.rating || 0,
            verified: braiderProfile.verified || false,
            verification_status: braiderProfile.verification_status || 'pending',
            created_at: braiderProfile.created_at,
          } : null,
        };
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(transformedUsers);
  } catch (error: any) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
