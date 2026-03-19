import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, braiderId } = body;

    if (!bookingId || !braiderId) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, braiderId' },
        { status: 400 }
      );
    }

    // Create service role client
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get booking details
    const { data: booking, error: bookingErr } = await serviceSupabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update booking status to accepted
    const { error: updateErr } = await serviceSupabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Check if conversation already exists — try new schema then old
    let existingConvId: string | null = null;
    const { data: existingConv } = await serviceSupabase
      .from('conversations').select('id').eq('booking_id', bookingId).maybeSingle();
    if (existingConv?.id) {
      existingConvId = existingConv.id;
    } else {
      // Try old schema
      const { data: oldConv } = await serviceSupabase
        .from('conversations').select('id')
        .eq('participant1_id', booking.customer_id).eq('participant2_id', braiderId).maybeSingle();
      if (oldConv?.id) existingConvId = oldConv.id;
    }

    let conversationId = existingConvId;

    if (!conversationId) {
      const now = new Date().toISOString();
      // Try new schema insert
      const { data: newConv, error: convErr } = await serviceSupabase
        .from('conversations')
        .insert({
          booking_id: bookingId,
          customer_id: booking.customer_id,
          braider_id: braiderId,
          status: 'active',
          started_at: now,
          created_at: now,
          updated_at: now,
        })
        .select('id').single();

      if (!convErr && newConv?.id) {
        conversationId = newConv.id;
      } else {
        // Fallback: old schema
        const { data: oldNew } = await serviceSupabase
          .from('conversations')
          .insert({ participant1_id: booking.customer_id, participant2_id: braiderId, created_at: now })
          .select('id').single();
        conversationId = oldNew?.id || null;
      }

      // Send system welcome message
      if (conversationId) {
        try {
          const { error: msgErr } = await serviceSupabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: braiderId,
            content: `Booking accepted! Let's discuss the details.`,
            read: false,
          });
          if (msgErr) {
            await serviceSupabase.from('messages').insert({
              sender_id: braiderId,
              receiver_id: booking.customer_id,
              content: `Booking accepted! Let's discuss the details.`,
            });
          }
        } catch {}
      }
    }

    // Notify customer (best-effort)
    try {
      const { error: notifErr } = await serviceSupabase.from('notifications').insert({
        user_id: booking.customer_id,
        type: 'booking',
        title: 'Booking Accepted!',
        message: 'Your braider has accepted your booking. You can now chat with them.',
        read: false,
      });
      if (notifErr) {
        await serviceSupabase.from('notifications').insert({
          user_id: booking.customer_id,
          type: 'booking',
          title: 'Booking Accepted!',
          message: 'Your braider has accepted your booking. You can now chat with them.',
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      bookingId,
      conversationId,
      message: 'Booking accepted and conversation created',
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
