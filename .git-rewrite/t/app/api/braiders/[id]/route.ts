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

    return NextResponse.json({
      ...braider,
      services: services || [],
      reviews: reviews || [],
    });
  } catch (err) {
    console.error('Braider profile API error:', err);
    return NextResponse.json({ error: 'Failed to fetch braider' }, { status: 500 });
  }
}
