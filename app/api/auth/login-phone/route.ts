import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Phone-based login endpoint
 * Accepts phone number + country + password
 * Finds user by phone and authenticates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, phone_country, password } = body;

    if (!phone || !phone_country || !password) {
      return NextResponse.json(
        { success: false, error: 'Phone, country, and password required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Step 1: Find user by phone number
    const { data: phoneMapping, error: phoneMappingError } = await supabase
      .from('phone_login_mappings')
      .select('user_id')
      .eq('phone', phone)
      .eq('phone_country', phone_country)
      .single();

    if (phoneMappingError || !phoneMapping) {
      console.error('Phone not found:', { phone, phone_country });
      return NextResponse.json(
        { success: false, error: 'Phone number not found or incorrect' },
        { status: 401 }
      );
    }

    const userId = phoneMapping.user_id;

    // Step 2: Get user's email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', userId);
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Step 3: Authenticate using email + password
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    });

    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Step 4: Verify role
    let correctRole = profile.role || 'customer';

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

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: profile.email,
        full_name: profile.full_name,
        role: correctRole,
        avatar_url: profile.avatar_url,
        phone,
        phone_country,
      },
      session: authData.session,
    });
  } catch (error) {
    console.error('Phone login error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
