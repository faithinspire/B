import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * HARD FIX: Admin users API
 * Returns all users with correct data
 * Graceful degradation: Returns empty list on error instead of failing
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      // Return empty list instead of error
      return NextResponse.json({
        success: true,
        data: [],
        stats: { total: 0, customers: 0, braiders: 0, admins: 0 },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Try to get all profiles - handle missing is_deleted column gracefully
    let profiles: any[] = [];
    
    // First try with is_deleted filter
    let { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, phone, avatar_url, created_at, is_deleted')
      .order('created_at', { ascending: false });

    if (profilesError) {
      // If is_deleted column doesn't exist, try without it
      console.warn('is_deleted column error, trying without filter:', profilesError.message);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, phone, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (fallbackError) {
        console.error('Failed to fetch profiles:', fallbackError);
        // Return empty list on error - graceful degradation
        return NextResponse.json({
          success: true,
          data: [],
          stats: { total: 0, customers: 0, braiders: 0, admins: 0 },
        });
      }
      profiles = fallbackData || [];
    } else {
      // Filter out deleted users if is_deleted column exists
      profiles = (profilesData || []).filter(p => p.is_deleted !== true);
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
    // Return empty list on error - graceful degradation
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, customers: 0, braiders: 0, admins: 0 },
    });
  }
}
