import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/location/braider/[id] - Get braider's current location
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const braider_id = params.id;
    const { searchParams } = new URL(request.url);
    const booking_id = searchParams.get('booking_id');

    if (!braider_id) {
      return NextResponse.json(
        { error: 'braider_id is required' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Build query for latest location — try with booking_id filter first, then fallback
    let locations: any[] | null = null;

    if (booking_id) {
      // Try filtered by booking_id
      const { data, error } = await serviceSupabase
        .from('location_tracking')
        .select('*')
        .eq('braider_id', braider_id)
        .eq('booking_id', booking_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        locations = data;
      }
    }

    // Fallback: get latest location for braider regardless of booking
    if (!locations || locations.length === 0) {
      const { data, error } = await serviceSupabase
        .from('location_tracking')
        .select('*')
        .eq('braider_id', braider_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching braider location:', error);
        return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
      }
      locations = data;
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({ error: 'No location found for braider' }, { status: 404 });
    }

    return NextResponse.json(locations[0]);
  } catch (error) {
    console.error('Get braider location error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get braider location';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
