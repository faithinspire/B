import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      bio,
      experience_years,
      specialties,
      service_type,
      travel_radius_miles,
      salon_address,
      cities,
      zip_codes,
      id_document_url,
      selfie_url,
      background_check_consent,
      next_of_kin_name,
      next_of_kin_phone,
      next_of_kin_relationship,
      verification_status,
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Create or update braider profile
    const { data, error } = await supabase
      .from('braider_profiles')
      .upsert({
        user_id,
        bio: bio || '',
        experience_years: experience_years || '',
        specialties: specialties || [],
        service_type: service_type || 'mobile',
        travel_radius_miles: travel_radius_miles || 10,
        salon_address: salon_address || '',
        cities: cities || [],
        zip_codes: zip_codes || '',
        id_document_url: id_document_url || '',
        selfie_url: selfie_url || '',
        background_check_consent: background_check_consent || false,
        next_of_kin_name: next_of_kin_name || '',
        next_of_kin_phone: next_of_kin_phone || '',
        next_of_kin_relationship: next_of_kin_relationship || '',
        verification_status: verification_status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Braider profile error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating braider profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create braider profile' },
      { status: 500 }
    );
  }
}
