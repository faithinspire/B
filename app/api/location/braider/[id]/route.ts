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

    // Build query for latest location
    let query = serviceSupabase
      .from('location_tracking')
      .select('*')
      .eq('braider_id', braider_id)
      .order('created_at', { ascending: false })
      .limit(1);

    // Filter by booking_id if provided
    if (booking_id) {
      // Verify booking exists
      const { data: booking, error: bookingError } = await serviceSupabase
        .from('bookings')
        .select('id')
        .eq('id', booking_id)
        .single();

      if (bookingError || !booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      query = query.eq('booking_id', booking_id);
    }

    const { data: locations, error } = await query;

    if (error) {
      console.error('Error fetching braider location:', error);
      return NextResponse.json(
        { error: 'Failed to fetch location' },
        { status: 500 }
      );
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json(
        { error: 'No location found for braider' },
        { status: 404 }
      );
    }

    return NextResponse.json(locations[0]);
  } catch (error) {
    console.error('Get braider location error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get braider location';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
