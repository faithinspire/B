import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
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

          if (updateError) throw updateError;

          // Notify customer
          if (customerId) {
            await supabase
              .from('notifications')
              .insert({
                user_id: customerId,
                type: 'payment',
                title: 'Payment Confirmed',
                body: `Your payment of $${(paymentIntent.amount / 100).toFixed(2)} has been confirmed.`,
                data: {
                  bookingId,
                  paymentIntentId: paymentIntent.id,
                },
              });
          }

          // Notify braider
          if (braiderId) {
            await supabase
              .from('notifications')
              .insert({
                user_id: braiderId,
                type: 'booking',
                title: 'Booking Payment Received',
                body: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} received for your booking.`,
                data: {
                  bookingId,
                  paymentIntentId: paymentIntent.id,
                },
              });
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

          if (updateError) throw updateError;

          // Notify customer
          if (customerId) {
            await supabase
              .from('notifications')
              .insert({
                user_id: customerId,
                type: 'payment',
                title: 'Payment Failed',
                body: `Your payment failed: ${failedIntent.last_payment_error?.message || 'Unknown error'}. Please try again.`,
                data: {
                  bookingId,
                  error: failedIntent.last_payment_error?.message,
                },
              });
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const bookingId = charge.metadata?.bookingId;

        if (bookingId) {
          // Update booking status to refunded
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'refunded',
              escrow_released: true,
            })
            .eq('id', bookingId);

          if (updateError) throw updateError;

          // Get booking details to notify customer
          const { data: booking } = await supabase
            .from('bookings')
            .select('customer_id')
            .eq('id', bookingId)
            .single();

          if (booking) {
            await supabase
              .from('notifications')
              .insert({
                user_id: booking.customer_id,
                type: 'payment',
                title: 'Refund Processed',
                body: `Your refund of $${(charge.amount_refunded / 100).toFixed(2)} has been processed.`,
                data: {
                  bookingId,
                  refundAmount: charge.amount_refunded / 100,
                },
              });
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
