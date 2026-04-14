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
    const { customer_id } = await request.json();

    if (!customer_id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .eq('customer_id', customer_id)
      .eq('status', 'awaiting_confirmation')
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found or not awaiting confirmation' },
        { status: 404 }
      );
    }

    // Update booking status to 'completed'
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Booking update error:', updateError);
      throw new Error(`Failed to confirm booking: ${updateError.message}`);
    }

    // Trigger payment release to braider
    const paymentRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/release`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: params.id,
          braider_id: booking.braider_id,
          amount: booking.total_price,
        }),
      }
    );

    if (!paymentRes.ok) {
      console.error('Payment release failed');
      // Don't throw - booking was already confirmed
    }

    // Notify braider of payment
    const { error: braiderNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.braider_id,
        type: 'payment_released',
        title: 'Payment Received',
        message: `Payment of ₦${booking.total_price} has been released for booking ${params.id}`,
        data: {
          booking_id: params.id,
          amount: booking.total_price,
          status: 'completed',
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (braiderNotifError) {
      console.error('Braider notification error:', braiderNotifError);
    }

    // Notify admin
    const { error: adminNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: 'admin',
        type: 'booking_completed',
        title: 'Booking Completed & Payment Released',
        message: `Booking ${params.id} completed. Payment of ₦${booking.total_price} released to braider.`,
        data: {
          booking_id: params.id,
          braider_id: booking.braider_id,
          amount: booking.total_price,
          status: 'completed',
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (adminNotifError) {
      console.error('Admin notification error:', adminNotifError);
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to confirm booking' },
      { status: 500 }
    );
  }
}
