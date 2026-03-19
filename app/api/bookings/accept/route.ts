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

    // Check if conversation already exists
    const { data: existingConv } = await serviceSupabase
      .from('conversations')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    let conversationId = existingConv?.id;

    // Create conversation if it doesn't exist
    if (!existingConv) {
      const { data: newConv, error: convErr } = await serviceSupabase
        .from('conversations')
        .insert({
          booking_id: bookingId,
          customer_id: booking.customer_id,
          braider_id: braiderId,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convErr) {
        console.error('Error creating conversation:', convErr);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      conversationId = newConv?.id;

      // Send system message
      if (conversationId) {
        await serviceSupabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: braiderId,
          sender_role: 'braider',
          content: `Booking accepted! Let's discuss the details.`,
          message_type: 'system',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

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
