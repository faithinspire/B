import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, amount, customerId, braiderId } = body;

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'Missing required fields: bookingId and amount' }, { status: 400 });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Try Stripe first, fall back to bypass mode if key is invalid
    const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    const hasValidStripeKey = stripeKey.startsWith('sk_') && stripeKey.length > 20;

    let paymentIntentId: string;
    let clientSecret: string;

    if (hasValidStripeKey) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          payment_method_types: ['card'],
          metadata: {
            bookingId,
            customerId: customerId || booking.customer_id,
            braiderId: braiderId || booking.braider_id,
          },
        });
        paymentIntentId = paymentIntent.id;
        clientSecret = paymentIntent.client_secret!;
      } catch (stripeErr: any) {
        console.error('Stripe error:', stripeErr?.message);
        // Fall through to bypass mode
        paymentIntentId = `bypass_pi_${Date.now()}`;
        clientSecret = `bypass_secret_${bookingId}_${Date.now()}`;
      }
    } else {
      // Bypass mode — no valid Stripe key
      console.warn('No valid Stripe key — using bypass payment mode');
      paymentIntentId = `bypass_pi_${Date.now()}`;
      clientSecret = `bypass_secret_${bookingId}_${Date.now()}`;
    }

    // Update booking
    await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntentId,
        status: 'pending_payment',
      })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      clientSecret,
      paymentIntentId,
      bypassMode: !hasValidStripeKey || clientSecret.startsWith('bypass_'),
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
