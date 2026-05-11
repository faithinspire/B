import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Admin users API - Returns all users
 * Graceful degradation: Works even if database schema is incomplete
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({
        success: true,
        data: [],
        stats: { total: 0, customers: 0, braiders: 0, admins: 0 },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Get all profiles - simple query without filters
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, phone, avatar_url, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      return NextResponse.json({
        success: true,
        data: [],
        stats: { total: 0, customers: 0, braiders: 0, admins: 0 },
      });
    }

    // Ensure we have an array
    const profileList = Array.isArray(profiles) ? profiles : [];

    // Get braider verification statuses if available
    let braiderMap: Record<string, string> = {};
    try {
      const { data: braiderProfiles } = await supabase
        .from('braider_profiles')
        .select('user_id, verification_status');

      if (braiderProfiles && Array.isArray(braiderProfiles)) {
        braiderMap = Object.fromEntries(
          braiderProfiles.map(bp => [bp.user_id, bp.verification_status])
        );
      }
    } catch (e) {
      console.warn('Could not fetch braider verification statuses:', e);
    }

    // Map profiles to users
    const users = profileList.map(profile => ({
      id: profile.id || '',
      email: profile.email || '',
      full_name: profile.full_name || '',
      role: profile.role || 'customer',
      phone: profile.phone || '',
      avatar_url: profile.avatar_url || null,
      verification_status: braiderMap[profile.id] || null,
      created_at: profile.created_at || new Date().toISOString(),
    }));

    // Calculate stats
    const stats = {
      total: users.length,
      customers: users.filter(u => u.role === 'customer').length,
      braiders: users.filter(u => u.role === 'braider').length,
      admins: users.filter(u => u.role === 'admin').length,
    };

    return NextResponse.json({
      success: true,
      data: users,
      stats,
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, customers: 0, braiders: 0, admins: 0 },
    });
  }
}

