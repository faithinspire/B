import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * Stripe Webhook Handler
 * Handles payment_intent.succeeded and payment_intent.payment_failed events
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe keys not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

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

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.bookingId;

      if (!bookingId) {
        console.error('No bookingId in payment metadata');
        return NextResponse.json({ received: true });
      }

      // Update payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          stripe_charge_id: paymentIntent.charges.data[0]?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

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

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.bookingId;

      if (!bookingId) {
        console.error('No bookingId in payment metadata');
        return NextResponse.json({ received: true });
      }

      // Update payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (updateError) {
        console.error('Failed to update payment:', updateError);
      }

      console.log('❌ Payment failed:', bookingId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
