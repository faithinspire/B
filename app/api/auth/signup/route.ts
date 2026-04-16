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
    const profileData: any = {
      id: userId,
      email,
      full_name,
      role, // EXPLICIT role - MUST be set here, not defaulting to customer
      phone,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add phone_country if provided
    if (phone_country) {
      profileData.phone_country = phone_country;
    }

    // HARD FIX: Use upsert from the start to ensure profile is created
    const { error: profileError, data: profileResult } = await serviceSupabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    if (!profileResult) {
      throw new Error('Profile creation returned no data');
    }

    console.log('✅ Profile created successfully:', { userId, role, email });

    // 3. If braider, create braider_profiles record with specialization
    if (role === 'braider') {
      const { 
        state, 
        city, 
        address,
        id_type,
        id_number,
        id_document_url,
        next_of_kin_name,
        next_of_kin_phone,
        next_of_kin_relationship,
      } = body

      // Create braider profile - CRITICAL: This MUST succeed for braider to be visible
      // Only insert columns that are guaranteed to exist
      const braiderProfileData: any = {
        user_id: userId,
        full_name,
        email,
        avatar_url: null,
        bio: bio || '',
        experience_years: years_experience || 0,
        rating_avg: 5.0,
        rating_count: 0,
        verification_status: 'pending',
        travel_radius_miles: 10,
        is_mobile: true,
        salon_address: address || null,
        specialties: specialization ? [specialization] : [],
        total_earnings: 0,
        available_balance: 0,
      };

      // Add optional columns if they exist in the schema
      if (phone) braiderProfileData.phone = phone;
      if (specialization) braiderProfileData.specialization = specialization;
      if (services) braiderProfileData.services = services;
      if (state) braiderProfileData.state = state;
      if (city) braiderProfileData.city = city;
      if (address) braiderProfileData.address = address;
      braiderProfileData.verified = false;
      if (next_of_kin_name) braiderProfileData.next_of_kin_name = next_of_kin_name;
      if (next_of_kin_phone) braiderProfileData.next_of_kin_phone = next_of_kin_phone;
      if (next_of_kin_relationship) braiderProfileData.next_of_kin_relationship = next_of_kin_relationship;
      if (id_type) braiderProfileData.id_type = id_type;
      if (id_number) braiderProfileData.id_number = id_number;
      if (id_document_url) braiderProfileData.id_document_url = id_document_url;

      const { error: braiderError } = await serviceSupabase
        .from('braider_profiles')
        .insert(braiderProfileData)

      if (braiderError) {
        console.error('Braider profile creation error:', braiderError);
        // CRITICAL: If braider_profiles creation fails, we must fail the entire signup
        // because the braider won't be visible in the system
        throw new Error(`Failed to create braider profile: ${braiderError.message}`);
      }

      // Create braider verification record in braider_verification table
      const verificationData: any = {
        user_id: userId,
        status: 'pending',
        full_name,
        location_country: 'NG',
      };

      if (phone) verificationData.phone = phone;
      if (state) verificationData.location_state = state;
      if (city) verificationData.location_city = city;
      if (years_experience) verificationData.years_experience = years_experience;
      if (specialization) verificationData.specialization = specialization;
      if (id_type) verificationData.id_document_type = id_type;
      if (id_number) verificationData.id_number = id_number;
      if (id_document_url) verificationData.id_document_url = id_document_url;
      verificationData.submitted_at = new Date().toISOString();

      const { error: verificationError } = await serviceSupabase
        .from('braider_verification')
        .insert(verificationData)

      if (verificationError) {
        console.error('Verification record creation error:', verificationError);
        // Log but don't fail - verification can be created later
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
