import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Get all users from auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError || !users) {
      console.error('Auth users error:', usersError);
      return NextResponse.json({ users: [], stats: { total: 0, admins: 0, braiders: 0, customers: 0 } });
    }

    // Get profiles for all users
    const userIds = users.map(u => u.id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Profiles error:', profilesError);
      return NextResponse.json({ users: [], stats: { total: 0, admins: 0, braiders: 0, customers: 0 } });
    }

    // Get braider profiles for braiders
    const { data: braiderProfiles } = await supabase
      .from('braider_profiles')
      .select('user_id, rating_avg, rating_count, verification_status')
      .in('user_id', userIds);

    const braiderMap = Object.fromEntries(
      (braiderProfiles || []).map(bp => [bp.user_id, bp])
    );

    // Combine data
    const result = users.map(user => {
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

    return NextResponse.json({ users: result, stats });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ users: [], stats: { total: 0, admins: 0, braiders: 0, customers: 0 } });
  }
}
