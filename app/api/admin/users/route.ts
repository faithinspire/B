import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * HARD FIX: Admin users API
 * Returns all users with correct data
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Get all profiles (source of truth for users)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, phone, avatar_url, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        { success: false, error: profilesError.message },
        { status: 500 }
      );
    }

    // Get braider verification statuses
    const { data: braiderProfiles } = await supabase
      .from('braider_profiles')
      .select('user_id, verification_status');

    const braiderMap = Object.fromEntries(
      (braiderProfiles || []).map(bp => [bp.user_id, bp.verification_status])
    );

    // Combine data
    const users = (profiles || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      phone: profile.phone || '',
      avatar_url: profile.avatar_url,
      verification_status: braiderMap[profile.id] || null,
      created_at: profile.created_at,
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
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
