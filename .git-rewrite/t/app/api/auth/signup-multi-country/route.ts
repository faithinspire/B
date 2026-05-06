import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizePhoneNumber, validatePhoneNumber, getCurrency, getPaymentGateway, CountryCode } from '@/lib/countries';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      phone_country,
      password,
      role = 'customer',
    } = body;

    // Validation
    if (!full_name || !email || !phone || !phone_country || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate phone number for country
    if (!validatePhoneNumber(phone, phone_country as CountryCode)) {
      return NextResponse.json(
        { error: 'Invalid phone number for selected country' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone, phone_country as CountryCode);

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if phone already exists in the same country
    const { data: existingPhone } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone_normalized', normalizedPhone)
      .eq('country', phone_country)
      .single();

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number already registered in this country' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name,
        role,
        country: phone_country,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Create profile with country and phone info
    const currency = getCurrency(phone_country as CountryCode);
    const paymentGateway = getPaymentGateway(phone_country as CountryCode);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        phone: phone,
        phone_normalized: normalizedPhone,
        country: phone_country,
        currency,
        payment_gateway: paymentGateway,
        role,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 400 }
      );
    }

    // If braider, create braider profile
    if (role === 'braider') {
      const { error: braiderError } = await supabaseAdmin
        .from('braider_profiles')
        .insert({
          user_id: authData.user.id,
          country: phone_country,
          created_at: new Date().toISOString(),
        });

      if (braiderError) {
        console.error('Braider profile error:', braiderError);
        // Don't fail, just log the error
      }
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          country: phone_country,
          currency,
          paymentGateway,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
