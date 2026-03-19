import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, braider_id, latitude, longitude, accuracy, speed, heading } = body;

    if (!braider_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'braider_id, latitude, longitude are required' }, { status: 400 });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Try new schema (braider_id column)
    const { data, error } = await db.from('location_tracking').insert([{
      booking_id: booking_id || null,
      braider_id,
      latitude,
      longitude,
      accuracy: accuracy ?? 0,
      speed: speed ?? 0,
      heading: heading ?? 0,
      is_active: true,
    }]).select().single();

    if (!error && data) return NextResponse.json(data, { status: 201 });

    console.error('New schema insert failed:', error?.message);

    // Fallback: old schema (user_id + user_type)
    const { data: data2, error: error2 } = await db.from('location_tracking').insert([{
      user_id: braider_id,
      user_type: 'braider',
      latitude,
      longitude,
      booking_id: booking_id || null,
      accuracy: accuracy ?? 0,
    }]).select().single();

    if (error2) {
      // Last resort: absolute minimum
      const { data: data3, error: error3 } = await db.from('location_tracking').insert([{
        user_id: braider_id,
        user_type: 'braider',
        latitude,
        longitude,
      }]).select().single();

      if (error3) {
        console.error('All location insert attempts failed:', error3.message);
        return NextResponse.json({ error: `Failed to save location: ${error3.message}` }, { status: 500 });
      }
      return NextResponse.json(data3, { status: 201 });
    }

    return NextResponse.json(data2, { status: 201 });
  } catch (error) {
    console.error('Location track error:', error);
    return NextResponse.json({ error: 'Failed to track location' }, { status: 500 });
  }
}
