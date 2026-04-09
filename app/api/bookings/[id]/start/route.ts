import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { braider_id } = await request.json();

    if (!braider_id) {
      return NextResponse.json(
        { error: 'Braider ID is required' },
        { status: 400 }
      );
    }

    // Update booking status to 'in_progress'
    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('braider_id', braider_id)
      .select()
      .single();

    if (updateError) {
      console.error('Booking update error:', updateError);
      throw new Error(`Failed to start booking: ${updateError.message}`);
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or unauthorized' },
        { status: 404 }
      );
    }

    // Notify admin
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: 'admin',
        type: 'booking_started',
        title: 'Braider Started Service',
        message: `Braider has started working on booking ${params.id}`,
        data: {
          booking_id: params.id,
          braider_id,
          status: 'in_progress',
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't throw - booking was already updated
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error starting booking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start booking' },
      { status: 500 }
    );
  }
}
