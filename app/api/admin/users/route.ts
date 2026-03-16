import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 500 }
      );
    }

    // Verify the user is admin by checking the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin - check profile.role FIRST (most reliable), then JWT metadata
    let userRole = (user.user_metadata as any)?.role;
    
    // Try to get role from profile table for more reliable check
    if (!userRole || userRole !== 'admin') {
      try {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          userRole = profile.role;
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    }

    if (userRole !== 'admin') {
      console.error('User role check failed:', { userRole, userId: user.id });
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users from auth.users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform data - get role from profiles table for accuracy
    const userIds = (users?.users || []).map((u: any) => u.id);
    
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, role, full_name')
          .in('id', userIds);

        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      }
    }

    const transformedUsers = (users?.users || []).map((u: any) => {
      const profile = profilesMap[u.id];
      return {
        id: u.id,
        email: u.email,
        full_name: profile?.full_name || u.user_metadata?.full_name || 'Unknown',
        role: profile?.role || u.user_metadata?.role || 'customer',
        created_at: u.created_at,
      };
    });

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
