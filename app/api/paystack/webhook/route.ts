import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Paystack webhook handler
 * Processes payment confirmations from Paystack
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Paystack not configured' },
        { status: 503 }
      );
    }

    const hash = crypto
      .createHmac('sha512', paystackKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    if (event.event !== 'charge.success') {
      console.log('Ignoring Paystack event:', event.event);
      return NextResponse.json({ success: true });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data } = event;
    const { reference, metadata, amount, status } = data;

    console.log('Processing Paystack payment:', {
      reference,
      status,
      amount,
      bookingId: metadata?.bookingId,
    });

    if (status !== 'success') {
      console.log('Payment not successful:', status);
      return NextResponse.json({ success: true });
    }

    const bookingId = metadata?.bookingId;
    if (!bookingId) {
      console.error('No bookingId in metadata');
      return NextResponse.json(
        { error: 'Invalid metadata' },
        { status: 400 }
      );
    }

    // Step 1: Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingId);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Step 2: Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        paystack_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Step 3: Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        customer_id: booking.customer_id,
        braider_id: booking.braider_id,
        amount: amount / 100, // Convert from kobo to naira
        status: 'completed',
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      // Don't fail - payment was already processed
    }

    // Step 4: Create notification for braider
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.braider_id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your booking with ${booking.customer_name} has been confirmed. Payment received: ₦${(amount / 100).toFixed(2)}`,
        data: { bookingId },
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail
    }

    console.log('Paystack payment processed successfully:', bookingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
