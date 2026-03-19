import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/bookings/[id]/confirm — marks booking as confirmed (used by bypass payment)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookingId = params.id;
    if (!bookingId) return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('id, customer_id, braider_id, status')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Fire notifications for both parties (best-effort)
    const notifs = [
      { user_id: booking.customer_id, type: 'payment', title: 'Payment Confirmed', message: 'Your booking payment was successful. Your booking is now confirmed.' },
      { user_id: booking.braider_id, type: 'booking', title: 'New Booking Confirmed', message: 'A customer has confirmed their booking with you.' },
    ];
    for (const n of notifs) {
      await supabase.from('notifications').insert({ ...n, booking_id: bookingId, read: false }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
