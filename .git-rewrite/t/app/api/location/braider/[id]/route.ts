import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const braider_id = params.id;
    const { searchParams } = new URL(request.url);
    const booking_id = searchParams.get('booking_id');

    if (!braider_id) {
      return NextResponse.json({ error: 'braider_id is required' }, { status: 400 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    let location: any = null;

    // Try 1: new schema — braider_id column, filtered by booking_id
    if (booking_id) {
      const { data } = await db.from('location_tracking')
        .select('*').eq('braider_id', braider_id).eq('booking_id', booking_id)
        .order('created_at', { ascending: false }).limit(1);
      if (data?.[0]) location = data[0];
    }

    // Try 2: new schema — braider_id column, any booking
    if (!location) {
      const { data } = await db.from('location_tracking')
        .select('*').eq('braider_id', braider_id)
        .order('created_at', { ascending: false }).limit(1);
      if (data?.[0]) location = data[0];
    }

    // Try 3: old schema — user_id column
    if (!location) {
      const { data } = await db.from('location_tracking')
        .select('*').eq('user_id', braider_id).eq('user_type', 'braider')
        .order('created_at', { ascending: false }).limit(1);
      if (data?.[0]) location = data[0];
    }

    // Try 4: old schema — user_id without user_type filter
    if (!location) {
      const { data } = await db.from('location_tracking')
        .select('*').eq('user_id', braider_id)
        .order('created_at', { ascending: false }).limit(1);
      if (data?.[0]) location = data[0];
    }

    if (!location) {
      return NextResponse.json({ error: 'No location found for braider' }, { status: 404 });
    }

    // Normalize: ensure latitude/longitude are present
    return NextResponse.json({
      ...location,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  } catch (error) {
    console.error('Get braider location error:', error);
    return NextResponse.json({ error: 'Failed to get location' }, { status: 500 });
  }
}
