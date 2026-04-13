import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    if (!bookingId) {
      return NextResponse.json({ booking: null, notes: [] });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking error:', bookingError);
      return NextResponse.json({ booking: null, notes: [] });
    }

    // Get customer and braider profiles
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', booking.customer_id)
      .single();

    const { data: braiderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', booking.braider_id)
      .single();

    // Get reviews for this booking (these are like "messages" about the booking)
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId);

    const notes = (reviews || []).map(review => ({
      id: review.id,
      booking_id: review.booking_id,
      reviewer_id: review.reviewer_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
    }));

    return NextResponse.json({
      booking: {
        ...booking,
        customer_name: customerProfile?.full_name || 'Unknown',
        braider_name: braiderProfile?.full_name || 'Unknown',
      },
      notes,
    });
  } catch (error) {
    console.error('Booking details API error:', error);
    return NextResponse.json({ booking: null, notes: [] });
  }
}
