import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

// Disable caching for this API route
export const revalidate = 0;
export const dynamic = 'force-dynamic';

const isValidUrl = (url: string): boolean => {
  try {
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
      console.error('=== API: Supabase URL not configured ===');
      return NextResponse.json([], { status: 200 });
    }

    // Use service role if available, otherwise fall back to anon key
    const keyToUse = serviceRoleKey || anonKey;
    if (!keyToUse) {
      console.error('=== API: No Supabase key configured ===');
      return NextResponse.json([], { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const country = searchParams.get('country');

    const serviceSupabase = createClient(supabaseUrl, keyToUse, {
      auth: { persistSession: false },
    });

    console.log('=== API: Fetching braiders ===', { state, city, country, usingServiceRole: !!serviceRoleKey });

    // ── Primary: query braider_profiles ──────────────────────────────────
    let query = serviceSupabase.from('braider_profiles').select('*');

    if (state) query = query.ilike('state', `%${state}%`);
    if (city) query = query.ilike('city', `%${city}%`);
    if (country) query = query.eq('country', country);

    const { data: braiderData, error: braiderError } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    console.log('=== API: braider_profiles result ===', {
      count: braiderData?.length,
      error: braiderError?.message,
    });

    // ── Fallback: if braider_profiles is empty, try profiles table ────────
    let rawData = braiderData || [];

    if ((!rawData || rawData.length === 0) && !braiderError) {
      console.log('=== API: braider_profiles empty, trying profiles table fallback ===');
      const { data: profilesData, error: profilesError } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('role', 'braider')
        .limit(100);

      if (!profilesError && profilesData && profilesData.length > 0) {
        console.log(`=== API: Found ${profilesData.length} braiders in profiles table ===`);
        rawData = profilesData.map((p: any) => ({
          ...p,
          user_id: p.id,
          profession_type: p.profession_type || 'braider',
          country: p.country || 'NG',
          verification_status: p.verification_status || 'pending',
          rating_avg: p.rating_avg || null,
          rating_count: p.rating_count || 0,
          bio: p.bio || '',
          experience_years: p.experience_years || 0,
          travel_radius_miles: p.travel_radius_miles || 10,
          is_mobile: p.is_mobile || false,
          specialties: p.specialties || [],
          total_earnings: p.total_earnings || 0,
          available_balance: p.available_balance || 0,
          total_bookings: p.total_bookings || 0,
        }));
      }
    }

    if (!rawData || rawData.length === 0) {
      console.warn('=== API: No braiders found in any table ===');
      return NextResponse.json([], {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      });
    }

    // ── Map to consistent shape ───────────────────────────────────────────
    const braiders = rawData.map((b: any) => {
      let professionType = 'braider';
      if (b.profession_type && b.profession_type.toLowerCase() === 'barber') {
        professionType = 'barber';
      } else if (!b.profession_type && b.specialization?.startsWith('barber:')) {
        professionType = 'barber';
      }

      let specialization = b.specialization || '';
      if (specialization.startsWith('barber:')) {
        specialization = specialization.substring(7);
      }

      const braiderCountry = b.country || 'NG';
      const paymentProvider = braiderCountry === 'US' || braiderCountry === 'USA' ? 'stripe' : 'paystack';

      return {
        id: b.id || b.user_id,
        user_id: b.user_id || b.id,
        full_name: b.full_name || '',
        email: b.email || '',
        avatar_url: b.avatar_url || null,
        bio: b.bio || '',
        experience_years: b.experience_years || 0,
        rating_avg: b.rating_avg || null,
        rating_count: b.rating_count || 0,
        verification_status: b.verification_status || 'pending',
        travel_radius_miles: b.travel_radius_miles || 10,
        is_mobile: b.is_mobile !== undefined ? b.is_mobile : true,
        salon_address: b.salon_address || '',
        specialties: b.specialties || [],
        specialization,
        profession_type: professionType,
        state: b.state || '',
        city: b.city || '',
        country: braiderCountry,
        payment_provider: paymentProvider,
        latitude: b.latitude || null,
        longitude: b.longitude || null,
        is_premium: b.is_premium || false,
        featured_order: b.featured_order || 0,
        services: [],
        portfolio: [],
        total_earnings: b.total_earnings || 0,
        available_balance: b.available_balance || 0,
        total_bookings: b.total_bookings || 0,
        instagram_url: b.instagram_url || null,
        tiktok_url: b.tiktok_url || null,
        portfolio_media: b.portfolio_media || [],
        created_at: b.created_at,
        updated_at: b.updated_at,
      };
    });

    console.log(`=== API: Returning ${braiders.length} braiders ===`);
    return NextResponse.json(braiders, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('=== API: Braiders API error ===', error);
    return NextResponse.json([], { status: 200 });
  }
}
