import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * COUNTRY-BASED SEARCH ENDPOINT
 * Separates USA (Stripe) and Nigeria (Paystack) braiders/barbers
 * Ensures proper payment provider routing
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json([], { status: 200 });
    }

    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'NG'; // Default to Nigeria
    const profession = searchParams.get('profession'); // 'braider' or 'barber'
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const searchQuery = searchParams.get('q');
    const minRating = searchParams.get('minRating');

    console.log('=== SEARCH API ===', { country, profession, state, city, searchQuery });

    // Build query
    let query = serviceSupabase
      .from('braider_profiles')
      .select('*')
      .eq('country', country); // CRITICAL: Filter by country

    // Filter by profession type
    if (profession === 'braider') {
      query = query.neq('profession_type', 'barber');
    } else if (profession === 'barber') {
      query = query.eq('profession_type', 'barber');
    }

    // Filter by location
    if (state) {
      query = query.ilike('state', `%${state}%`);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    // Filter by search query (name, bio, specialization)
    if (searchQuery) {
      query = query.or(
        `full_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%,specialization.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
      );
    }

    // Filter by minimum rating
    if (minRating) {
      const rating = parseFloat(minRating);
      if (!isNaN(rating)) {
        query = query.gte('rating_avg', rating);
      }
    }

    // Execute query
    const { data, error } = await query
      .order('rating_avg', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json([], { status: 200 });
    }

    if (!data || data.length === 0) {
      console.log(`No ${profession || 'professionals'} found in ${country}`);
      return NextResponse.json([], { status: 200 });
    }

    // Map data with payment provider info
    const professionals = (data || []).map((b: any) => {
      let professionType = 'braider';
      if (b.profession_type && b.profession_type.toLowerCase() === 'barber') {
        professionType = 'barber';
      }

      // Determine payment provider based on country
      let paymentProvider = 'paystack'; // Default to Paystack for Nigeria
      if (country === 'US' || country === 'USA') {
        paymentProvider = 'stripe'; // Use Stripe for USA
      }

      let specialization = b.specialization || '';
      if (specialization.startsWith('barber:')) {
        specialization = specialization.substring(7);
      }

      return {
        id: b.id || b.user_id,
        user_id: b.user_id,
        full_name: b.full_name || '',
        email: b.email || '',
        avatar_url: b.avatar_url || null,
        bio: b.bio || '',
        experience_years: b.experience_years || 0,
        rating_avg: b.rating_avg || null,
        rating_count: b.rating_count || 0,
        verification_status: b.verification_status || 'unverified',
        travel_radius_miles: b.travel_radius_miles || 10,
        is_mobile: b.is_mobile || false,
        salon_address: b.salon_address || '',
        specialties: b.specialties || [],
        specialization,
        profession_type: professionType,
        state: b.state || '',
        city: b.city || '',
        country: b.country || country,
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
        payment_provider: paymentProvider, // CRITICAL: Add payment provider
        created_at: b.created_at,
        updated_at: b.updated_at,
      };
    });

    console.log(`Returning ${professionals.length} professionals from ${country}`);
    return NextResponse.json(professionals, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
