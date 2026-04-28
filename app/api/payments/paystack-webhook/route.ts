import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Paystack Webhook Handler
 * Handles charge.success and charge.failed events
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-paystack-signature header' },
        { status: 400 }
      );
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackKey) {
      return NextResponse.json(
        { error: 'Paystack key not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', paystackKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Paystack webhook signature verification failed');
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Handle charge.success
    if (event.event === 'charge.success') {
      const data = event.data;
      const bookingId = data.metadata?.bookingId;
      const reference = data.reference;

      if (!bookingId) {
        console.error('No bookingId in payment metadata');
        return NextResponse.json({ received: true });
      }

      // Update payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          paystack_reference: reference,
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference);

      if (updateError) {
        console.error('Failed to update payment:', updateError);
      }

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingError) {
        console.error('Failed to update booking:', bookingError);
      }

      console.log('✅ Payment succeeded:', bookingId);
    }

    // Handle charge.failed
    if (event.event === 'charge.failed') {
      const data = event.data;
      const bookingId = data.metadata?.bookingId;
      const reference = data.reference;

      if (!bookingId) {
        console.error('No bookingId in payment metadata');
        return NextResponse.json({ received: true });
      }

      // Update payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          paystack_reference: reference,
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference);

      if (updateError) {
        console.error('Failed to update payment:', updateError);
      }

      console.log('❌ Payment failed:', bookingId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
