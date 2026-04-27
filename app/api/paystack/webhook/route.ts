import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature
    const paystackKey = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto
      .createHmac('sha512', paystackKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const { bookingId } = metadata;

      if (!bookingId) {
        console.error('No booking ID in webhook metadata');
        return NextResponse.json({ error: 'No booking ID' }, { status: 400 });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        { auth: { persistSession: false } }
      );

      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'completed',
          paystack_reference: reference,
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Failed to update booking:', error);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
      }

      console.log('Booking confirmed via Paystack:', bookingId);
      return NextResponse.json({ success: true });
    }

    if (event.event === 'charge.failed') {
      const { reference, metadata } = event.data;
      const { bookingId } = metadata;

      if (!bookingId) {
        return NextResponse.json({ error: 'No booking ID' }, { status: 400 });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        { auth: { persistSession: false } }
      );

      // Update booking status
      await supabase
        .from('bookings')
        .update({
          status: 'payment_failed',
          payment_status: 'failed',
        })
        .eq('id', bookingId);

      console.log('Booking payment failed:', bookingId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
