import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Get all users from auth with pagination (default limit is 50)
    let allUsers: any[] = [];
    let pageNumber = 0;
    const pageSize = 50;
    let hasMore = true;

    console.log('=== USERS API: Starting pagination ===');

    while (hasMore) {
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
        page: pageNumber,
        perPage: pageSize,
      });

      console.log(`=== USERS API: Page ${pageNumber} - Got ${users?.length || 0} users ===`);

      if (usersError) {
        console.error('Auth users error:', usersError);
        break;
      }

      if (!users || users.length === 0) {
        hasMore = false;
        break;
      }

      allUsers = allUsers.concat(users);
      
      if (users.length < pageSize) {
        hasMore = false;
      } else {
        pageNumber++;
      }
    }

    console.log(`=== USERS API: Total users fetched: ${allUsers.length} ===`);

    if (allUsers.length === 0) {
      console.error('No users found');
      return NextResponse.json({ users: [], stats: { total: 0, admins: 0, braiders: 0, customers: 0 } });
    }

    console.log(`=== USERS API: Got ${allUsers.length} auth users, fetching profiles ===`);

    // Get profiles for all users
    const userIds = allUsers.map(u => u.id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    console.log(`=== USERS API: Got ${profiles?.length || 0} profiles ===`);

    if (profilesError) {
      console.error('Profiles error:', profilesError);
      return NextResponse.json({ users: [], stats: { total: 0, admins: 0, braiders: 0, customers: 0 } });
    }

    // Get braider profiles for braiders
    const { data: braiderProfiles } = await supabase
      .from('braider_profiles')
      .select('user_id, rating_avg, rating_count, verification_status')
      .in('user_id', userIds);

    console.log(`=== USERS API: Got ${braiderProfiles?.length || 0} braider profiles ===`);

    const braiderMap = Object.fromEntries(
      (braiderProfiles || []).map(bp => [bp.user_id, bp])
    );

    // Combine data
    const result = allUsers.map(user => {
      const profile = profiles?.find(p => p.id === user.id);
      const braider = braiderMap[user.id];

      return {
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || user.email?.split('@')[0] || 'Unknown',
        role: profile?.role || 'customer',
        phone: profile?.phone || '',
        avatar_url: profile?.avatar_url || null,
        rating: braider?.rating_avg || null,
        verification_status: braider?.verification_status || null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      };
    });

    // Calculate stats
    const stats = {
      total: result.length,
      admins: result.filter(u => u.role === 'admin').length,
      braiders: result.filter(u => u.role === 'braider').length,
      customers: result.filter(u => u.role === 'customer').length,
    };

    console.log(`=== USERS API: Final stats ===`, stats);
    console.log(`=== USERS API: Returning ${result.length} users ===`);

    return NextResponse.json({ users: result, stats });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ users: [], stats: { total: 0, admins: 0, braiders: 0, customers: 0 } });
  }
}
