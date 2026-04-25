import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const id = params.id;

    // Try by user_id first (most common — search page links by user_id)
    let { data: braider, error } = await serviceSupabase
      .from('braider_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    // Fallback: try by primary key id
    if (!braider || error) {
      const result = await serviceSupabase
        .from('braider_profiles')
        .select('*')
        .eq('id', id)
        .single();
      braider = result.data;
      error = result.error;
    }

    if (!braider) {
      return NextResponse.json({ error: 'Braider not found' }, { status: 404 });
    }

    // Fetch services
    const { data: services } = await serviceSupabase
      .from('services')
      .select('id, name, description, duration_minutes, price')
      .eq('braider_id', braider.user_id);

    // Fetch reviews
    const { data: reviews } = await serviceSupabase
      .from('reviews')
      .select('id, rating, comment, reviewer_id')
      .eq('braider_id', braider.user_id)
      .limit(10);

    // Count total bookings
    const { count: bookingCount } = await serviceSupabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('braider_id', braider.user_id);

    // Detect barber from specialization prefix if profession_type column doesn't exist
    let professionType = braider.profession_type || 'braider';
    let specialization = braider.specialization || '';
    if (specialization.startsWith('barber:')) {
      professionType = 'barber';
      specialization = specialization.substring(7);
    }

    return NextResponse.json({
      ...braider,
      specialization,
      profession_type: professionType,
      total_bookings: bookingCount || braider.total_bookings || 0,
      instagram_url: braider.instagram_url || null,
      tiktok_url: braider.tiktok_url || null,
      portfolio_media: braider.portfolio_media || [],
      services: services || [],
      reviews: reviews || [],
    });
  } catch (err) {
    console.error('Braider profile API error:', err);
    return NextResponse.json({ error: 'Failed to fetch braider' }, { status: 500 });
  }
}
