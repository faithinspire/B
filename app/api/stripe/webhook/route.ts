import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Create service role client for database operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;
        const customerId = paymentIntent.metadata?.customerId;
        const braiderId = paymentIntent.metadata?.braiderId;

        if (bookingId) {
          // Update booking status to escrowed
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'escrowed',
              stripe_payment_intent_id: paymentIntent.id,
              auto_release_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', bookingId);

          if (updateError) {
            console.error('Booking update error:', updateError);
            throw updateError;
          }

          // Notify customer
          if (customerId) {
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                user_id: customerId,
                type: 'payment',
                title: 'Payment Confirmed',
                message: `Your payment of $${(paymentIntent.amount / 100).toFixed(2)} has been confirmed.`,
                data: {
                  bookingId,
                  paymentIntentId: paymentIntent.id,
                },
              });
            if (notifError) console.error('Customer notification error:', notifError);
          }

          // Notify braider
          if (braiderId) {
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                user_id: braiderId,
                type: 'booking',
                title: 'Booking Payment Received',
                message: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} received for your booking.`,
                data: {
                  bookingId,
                  paymentIntentId: paymentIntent.id,
                },
              });
            if (notifError) console.error('Braider notification error:', notifError);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = failedIntent.metadata?.bookingId;
        const customerId = failedIntent.metadata?.customerId;

        if (bookingId) {
          // Update booking status to cancelled
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              cancellation_reason: `Payment failed: ${failedIntent.last_payment_error?.message || 'Unknown error'}`,
            })
            .eq('id', bookingId);

          if (updateError) {
            console.error('Booking cancellation error:', updateError);
            throw updateError;
          }

          // Notify customer
          if (customerId) {
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                user_id: customerId,
                type: 'payment',
                title: 'Payment Failed',
                message: `Payment failed: ${failedIntent.last_payment_error?.message || 'Unknown error'}`,
                data: { bookingId },
              });
            if (notifError) console.error('Customer notification error:', notifError);
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Find booking by payment intent
          const { data: bookings, error: findError } = await supabase
            .from('bookings')
            .select('id, customer_id')
            .eq('stripe_payment_intent_id', paymentIntentId);

          if (!findError && bookings && bookings.length > 0) {
            const booking = bookings[0];

            // Update booking status
            const { error: updateError } = await supabase
              .from('bookings')
              .update({
                status: 'refunded',
                refund_amount: charge.amount_refunded / 100,
              })
              .eq('id', booking.id);

            if (updateError) {
              console.error('Booking refund error:', updateError);
              throw updateError;
            }

            // Notify customer
            if (booking.customer_id) {
              const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                  user_id: booking.customer_id,
                  type: 'payment',
                  title: 'Refund Processed',
                  message: `Refund of $${(charge.amount_refunded / 100).toFixed(2)} has been processed.`,
                  data: { bookingId: booking.id },
                });
              if (notifError) console.error('Customer notification error:', notifError);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
