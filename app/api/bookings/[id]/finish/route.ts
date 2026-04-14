import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, key);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const { braider_id } = await request.json();

    if (!braider_id) {
      return NextResponse.json(
        { error: 'Braider ID is required' },
        { status: 400 }
      );
    }

    // Update booking status to 'awaiting_confirmation'
    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'awaiting_confirmation',
        finished_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('braider_id', braider_id)
      .eq('status', 'in_progress')
      .select()
      .single();

    if (updateError) {
      console.error('Booking update error:', updateError);
      throw new Error(`Failed to finish booking: ${updateError.message}`);
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found, not in progress, or unauthorized' },
        { status: 404 }
      );
    }

    // Notify customer to confirm
    const { error: customerNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.customer_id,
        type: 'booking_finished',
        title: 'Service Complete - Please Confirm',
        message: 'Your braider has finished the service. Please confirm to complete the booking.',
        data: {
          booking_id: params.id,
          braider_id,
          status: 'awaiting_confirmation',
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (customerNotifError) {
      console.error('Customer notification error:', customerNotifError);
    }

    // Notify admin
    const { error: adminNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: 'admin',
        type: 'booking_finished',
        title: 'Braider Finished Service',
        message: `Braider has finished booking ${params.id}. Awaiting customer confirmation.`,
        data: {
          booking_id: params.id,
          braider_id,
          status: 'awaiting_confirmation',
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (adminNotifError) {
      console.error('Admin notification error:', adminNotifError);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error finishing booking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to finish booking' },
      { status: 500 }
    );
  }
}
