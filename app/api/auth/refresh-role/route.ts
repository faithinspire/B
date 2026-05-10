import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Refresh user's role from database
 * Called when user needs to get updated role (e.g., after admin assignment)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

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

    // Fetch fresh profile data from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url, country')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Determine correct role
    let correctRole = profile.role || 'customer';

    // If profile says braider, verify braider_profiles exists
    if (correctRole === 'braider') {
      const { data: braiderProfile } = await supabase
        .from('braider_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (!braiderProfile) {
        correctRole = 'customer';
      }
    }

    console.log(`✅ Role refreshed for ${profile.email}: ${correctRole}`);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: profile.email,
        full_name: profile.full_name,
        role: correctRole,
        avatar_url: profile.avatar_url,
        country: profile.country || null,
      },
    });
  } catch (error) {
    console.error('Role refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
