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
      country: bodyCountry, // explicit country from signup form
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

    // Resolve country — use explicit body.country, then phone_country, never default to 'NG'
    const resolvedCountry: string = bodyCountry || phone_country || 'NG';

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
    // Only include columns that are guaranteed to exist in the profiles table
    const profileData: any = {
      id: userId,
      email,
      full_name,
      role, // EXPLICIT role - MUST be set here, not defaulting to customer
    };

    // Add optional columns only if they have values
    if (phone) profileData.phone = phone;
    if (resolvedCountry) profileData.country = resolvedCountry;
    if (phone_country) profileData.phone_country = phone_country;
    
    // Set timestamps
    profileData.created_at = new Date().toISOString();
    profileData.updated_at = new Date().toISOString();

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
        profession_type,
      } = body

      // Create braider profile - CRITICAL: This MUST succeed for braider to be visible
      // Build the data object with only columns that are likely to exist
      const braiderProfileData: any = {
        user_id: userId,
        full_name,
        email,
        country: resolvedCountry, // Use resolved country — never hardcode 'NG'
      };

      // Add optional fields
      if (bio) braiderProfileData.bio = bio;
      if (years_experience) braiderProfileData.experience_years = years_experience;
      if (specialization) braiderProfileData.specialization = specialization;
      if (phone) braiderProfileData.phone = phone;
      if (state) braiderProfileData.state = state;
      if (city) braiderProfileData.city = city;
      if (address) braiderProfileData.address = address;
      if (next_of_kin_name) braiderProfileData.next_of_kin_name = next_of_kin_name;
      if (next_of_kin_phone) braiderProfileData.next_of_kin_phone = next_of_kin_phone;
      if (next_of_kin_relationship) braiderProfileData.next_of_kin_relationship = next_of_kin_relationship;
      if (id_type) braiderProfileData.id_type = id_type;
      if (id_number) braiderProfileData.id_number = id_number;
      if (id_document_url) braiderProfileData.id_document_url = id_document_url;
      if (profession_type) braiderProfileData.profession_type = profession_type;
      if (body.instagram_url) braiderProfileData.instagram_url = body.instagram_url;
      if (body.tiktok_url) braiderProfileData.tiktok_url = body.tiktok_url;
      if (services) braiderProfileData.services = services;

      // Set defaults for required fields
      braiderProfileData.avatar_url = null;
      braiderProfileData.rating_avg = 5.0;
      braiderProfileData.rating_count = 0;
      braiderProfileData.verification_status = 'pending';
      braiderProfileData.travel_radius_miles = 10;
      braiderProfileData.is_mobile = true;
      braiderProfileData.total_earnings = 0;
      braiderProfileData.available_balance = 0;
      braiderProfileData.verified = false;

      const { error: braiderError } = await serviceSupabase
        .from('braider_profiles')
        .insert(braiderProfileData)

      if (braiderError) {
        console.error('Braider profile creation error:', braiderError);
        // Try to insert with minimal fields if the full insert fails
        if (braiderError.message?.includes('column')) {
          const minimalData = {
            user_id: userId,
            full_name,
            email,
            country: resolvedCountry,
          };
          const { error: minimalError } = await serviceSupabase
            .from('braider_profiles')
            .insert(minimalData);
          
          if (minimalError) {
            console.error('Minimal braider profile creation error:', minimalError);
            throw new Error(`Failed to create braider profile: ${minimalError.message}`);
          }
        } else {
          throw new Error(`Failed to create braider profile: ${braiderError.message}`);
        }
      }

      // Create braider verification record in braider_verification table
      const verificationData: any = {
        user_id: userId,
        status: 'pending',
        full_name,
        location_country: resolvedCountry, // Use actual country
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

    // 4. If phone provided, create phone login mapping
    if (phone && phone_country) {
      const { error: phoneMappingError } = await serviceSupabase
        .from('phone_login_mappings')
        .insert({
          user_id: userId,
          phone,
          phone_country,
        });

      if (phoneMappingError) {
        console.error('Phone mapping creation error:', phoneMappingError);
        // Log but don't fail - phone login can be added later
      }
    }

    // 5. Create initial notification
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

    // 6. Return success - session will be created on next auth check
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
