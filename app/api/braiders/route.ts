import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Disable caching for this API route
export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Helper to check if URL is valid
const isValidUrl = (url: string): boolean => {
  try {
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    console.log('=== API: /api/braiders GET request ===');
    console.log('=== API: Supabase URL configured:', !!supabaseUrl);
    console.log('=== API: Service role key configured:', !!serviceRoleKey);

    // Check if Supabase is configured
    if (!supabaseUrl || !serviceRoleKey || !isValidUrl(supabaseUrl)) {
      console.error('=== API: Supabase not properly configured ===');
      console.error('=== API: URL valid:', isValidUrl(supabaseUrl));
      console.error('=== API: URL:', supabaseUrl);
      return NextResponse.json([], { status: 200 });
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    console.log('=== API: Fetching braiders from braider_profiles table ===');

    // Fetch verified braiders from braider_profiles table
    const { data, error } = await serviceSupabase
      .from('braider_profiles')
      .select('*')
      .eq('verification_status', 'verified') // CRITICAL: Only return verified braiders
      .order('rating_avg', { ascending: false })
      .order('created_at', { ascending: false });

    console.log('=== API: Braiders fetch result ===', { dataCount: data?.length, hasError: !!error });

    if (error) {
      console.error('=== API: Error fetching braiders ===', error);
      return NextResponse.json([], { status: 200 });
    }

    if (!data || data.length === 0) {
      console.warn('=== API: WARNING - No braiders found in database ===');
      return NextResponse.json([], { status: 200 });
    }

    // Map data to include all fields
    const braiders = (data || []).map((b: any) => ({
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
      specialization: b.specialization || '',
      state: b.state || '',
      city: b.city || '',
      country: b.country || 'NG',
      latitude: b.latitude || null,
      longitude: b.longitude || null,
      is_premium: b.is_premium || false,
      featured_order: b.featured_order || 0,
      services: [],
      portfolio: [],
      total_earnings: b.total_earnings || 0,
      available_balance: b.available_balance || 0,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));

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
