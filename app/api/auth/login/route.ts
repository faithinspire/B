import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * HARD FIX: Clean login endpoint that ensures role is correctly set
 * Returns user with verified role from database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
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

    // Sign in user using regular client (not admin)
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
      auth: { persistSession: false }
    });

    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError?.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // CRITICAL: Fetch profile to get CORRECT role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
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
        // Profile says braider but no braider_profiles record
        correctRole = 'customer';
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: profile.email,
        full_name: profile.full_name,
        role: correctRole,
        avatar_url: profile.avatar_url,
      },
      session: authData.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
