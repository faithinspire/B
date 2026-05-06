import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/location/history/[booking_id] - Get location history for a booking
export async function GET(
  request: Request,
  { params }: { params: { booking_id: string } }
) {
  try {
    const booking_id = params.booking_id;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    if (!booking_id) {
      return NextResponse.json(
        { error: 'booking_id is required' },
        { status: 400 }
      );
    }

    // Parse and validate limit
    let limit = 100;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        return NextResponse.json(
          { error: 'limit must be a number between 1 and 1000' },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Parse and validate offset
    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: 'offset must be a non-negative number' },
          { status: 400 }
        );
      }
      offset = parsedOffset;
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

    // Get location history
    const { data: locations, error, count } = await serviceSupabase
      .from('location_tracking')
      .select('*', { count: 'exact' })
      .eq('booking_id', booking_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching location history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch location history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: locations || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get location history error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get location history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
