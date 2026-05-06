import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { reason, cancelled_by } = await request.json();
    const bookingId = params.id;

    if (!bookingId || !cancelled_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking can be cancelled
    if (['completed', 'cancelled', 'refunded'].includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot cancel booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Calculate refund based on cancellation timing
    const appointmentDate = new Date(booking.appointment_date);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = booking.total_amount;
    let cancellationFee = 0;

    // Cancellation policy: Full refund if >24h, 50% if 12-24h, no refund if <12h
    if (hoursUntilAppointment < 12) {
      refundAmount = 0;
      cancellationFee = booking.total_amount;
    } else if (hoursUntilAppointment < 24) {
      refundAmount = booking.total_amount * 0.5;
      cancellationFee = booking.total_amount * 0.5;
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    // Process refund if applicable
    if (refundAmount > 0 && booking.stripe_charge_id) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      try {
        await stripe.refunds.create({
          charge: booking.stripe_charge_id,
          amount: Math.round(refundAmount * 100), // Convert to cents
        });
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        // Continue even if refund fails - booking is cancelled
      }
    }

    // Create notification for other party
    const otherUserId = cancelled_by === booking.customer_id ? booking.braider_id : booking.customer_id;
    
    await supabase
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        body: `A booking has been cancelled. Reason: ${reason || 'No reason provided'}`,
        data: {
          booking_id: bookingId,
          refund_amount: refundAmount,
        },
      });

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      status: 'cancelled',
      refund_amount: refundAmount,
      cancellation_fee: cancellationFee,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
