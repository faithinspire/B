import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

    // Get all braiders with their profiles
    const { data: braiderProfiles, error: braiderError } = await supabaseAdmin
      .from('braider_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (braiderError) {
      console.error('Braider profiles fetch error:', braiderError);
      throw braiderError;
    }

    // Get user profiles for braiders
    const userIds = (braiderProfiles || []).map(bp => bp.user_id);
    let profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      } catch (err) {
        console.error('Profiles fetch error:', err);
      }
    }

    // Transform braiders with user info
    const transformedBraiders = (braiderProfiles || []).map(bp => {
      const profile = profilesMap[bp.user_id];
      return {
        id: bp.id,
        user_id: bp.user_id,
        full_name: profile?.full_name || 'Unknown',
        email: profile?.email || '',
        phone_number: bp.phone_number || '',
        next_of_kin_name: bp.next_of_kin_name || '',
        next_of_kin_phone: bp.next_of_kin_phone || '',
        next_of_kin_relationship: bp.next_of_kin_relationship || '',
        id_document_url: bp.id_document_url || '',
        selfie_url: bp.selfie_url || '',
        bio: bp.bio || '',
        rating: bp.rating || 0,
        verified: bp.verified || false,
        verification_status: bp.verification_status || 'pending',
        created_at: bp.created_at,
      };
    });

    return NextResponse.json(transformedBraiders);
  } catch (error: any) {
    console.error('Verification fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch braiders' },
      { status: 500 }
    );
  }
}
