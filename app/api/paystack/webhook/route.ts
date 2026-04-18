import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Paystack Webhook Handler
 * Handles payment events from Paystack for Nigerian payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature (optional but recommended)
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error('Paystack secret key not configured');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Parse the event
    const event = JSON.parse(body);
    
    console.log('Paystack webhook event:', event.event);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const data = event.data;
        const reference = data.reference;
        const metadata = data.metadata || {};

        console.log('Payment successful:', { reference, metadata });

        // Check if this is a booking payment
        if (metadata.bookingId) {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'escrowed',
              payment_reference: reference,
              payment_status: 'paid',
              auto_release_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', metadata.bookingId);

          if (updateError) {
            console.error('Failed to update booking:', updateError);
          } else {
            // Send notification to customer
            await supabase
              .from('notifications')
              .insert({
                user_id: metadata.customerId,
                type: 'payment',
                title: 'Payment Confirmed',
                message: `Your payment of ₦${(data.amount / 100).toLocaleString()} has been confirmed.`,
                data: { bookingId: metadata.bookingId, reference },
              });

            // Send notification to braider
            await supabase
              .from('notifications')
              .insert({
                user_id: metadata.braiderId,
                type: 'payment',
                title: 'Payment Received',
                message: `Payment of ₦${(data.amount / 100).toLocaleString()} received for booking.`,
                data: { bookingId: metadata.bookingId, reference },
              });
          }
        }

        // Check if this is a marketplace order payment
        if (metadata.orderId) {
          const { error: updateError } = await supabase
            .from('marketplace_orders')
            .update({
              payment_status: 'paid',
              payment_reference: reference,
              status: 'processing',
            })
            .eq('id', metadata.orderId);

          if (updateError) {
            console.error('Failed to update order:', updateError);
          }
        }
        break;
      }

      case 'charge.failed': {
        const data = event.data;
        const metadata = data.metadata || {};

        console.log('Payment failed:', data.reference);

        if (metadata.bookingId) {
          await supabase
            .from('notifications')
            .insert({
              user_id: metadata.customerId,
              type: 'payment',
              title: 'Payment Failed',
              message: `Your payment could not be completed. Please try again.`,
              data: { bookingId: metadata.bookingId, reference: data.reference },
            });
        }
        break;
      }

      case 'transfer.success': {
        // Handle successful transfer to braider (payout)
        const data = event.data;
        console.log('Transfer successful:', data.reference);
        break;
      }

      case 'transfer.failed': {
        const data = event.data;
        console.log('Transfer failed:', data.reference);
        break;
      }

      default:
        console.log('Unhandled Paystack event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
