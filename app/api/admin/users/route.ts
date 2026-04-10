import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

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

    // Fetch bookings count
    let bookingCountMap: Record<string, number> = {};
    try {
      const { data: bookings, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select('customer_id');

      if (!bookingsError && bookings) {
        bookingCountMap = bookings.reduce((acc: any, b: any) => {
          acc[b.customer_id] = (acc[b.customer_id] || 0) + 1;
          return acc;
        }, {});
      }
    } catch (err) {
      console.error('Bookings fetch error:', err);
    }

    // Transform users with all details
    const transformedUsers = (users?.users || [])
      .map((u: any) => {
        const profile = profilesMap[u.id];
        const fullName = profile?.full_name || u.email?.split('@')[0] || 'Unknown User';
        const email = u.email || '';
        const role = profile?.role || u.user_metadata?.role || 'customer';
        
        return {
          id: u.id,
          email: email,
          full_name: fullName,
          phone: profile?.phone || '',
          location: profile?.location || '',
          role: role,
          status: profile?.status || 'active',
          created_at: u.created_at,
          avatar_url: profile?.avatar_url || null,
          booking_count: bookingCountMap[u.id] || 0,
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
