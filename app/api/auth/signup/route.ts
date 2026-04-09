import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      full_name, 
      role,
      phone,
      phone_country,
      specialization,
      years_experience,
      services,
      bio,
    } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, role' },
        { status: 400 }
      )
    }

    if (!['braider', 'customer', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be braider, customer, or admin' },
        { status: 400 }
      )
    }

    // Use service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    // 1. Create auth user
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        phone,
        phone_country,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. Create profile record with EXPLICIT role - CRITICAL for auth
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name,
        role, // EXPLICIT role - MUST be set here, not defaulting to customer
        phone,
        phone_country,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Profile error:', profileError);
      // If insert fails, try upsert to ensure role is set
      const { error: upsertError } = await serviceSupabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name,
          role, // EXPLICIT role
          phone,
          phone_country,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });
      
      if (upsertError) {
        console.error('Profile upsert error:', upsertError);
      }
    }

    // 3. If braider, create braider_profiles record with specialization
    if (role === 'braider') {
      const { error: braiderError } = await serviceSupabase
        .from('braider_profiles')
        .insert({
          id: `braider_${userId}`,
          user_id: userId,
          full_name,
          email,
          phone,
          avatar_url: null,
          bio: bio || '',
          experience_years: years_experience || 0,
          specialization: specialization || '',
          services: services || '',
          rating_avg: 5.0,
          rating_count: 0,
          verification_status: 'unverified',
          travel_radius_miles: 10,
          is_mobile: true,
          salon_address: null,
          specialties: specialization ? [specialization] : [],
          total_earnings: 0,
          available_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (braiderError) {
        console.error('Braider profile error:', braiderError)
        // Continue - profile was created, just missing braider details
      }
    }

    // 4. Create initial notification
    const { error: notificationError } = await serviceSupabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'welcome',
        title: 'Welcome to BraidMe',
        message: `Welcome ${full_name}! Your account has been created successfully.`,
        data: { role },
        is_read: false,
        created_at: new Date().toISOString(),
      })

    if (notificationError) {
      console.error('Notification error:', notificationError)
    }

    // 5. Return success - session will be created on next auth check
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        full_name,
        role,
        phone,
        phone_country,
      },
      message: 'User created successfully',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('Signup error:', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
