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

    // Get Stripe key - try multiple sources
    let stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return NextResponse.json({ 
        error: 'Payment system not configured. Contact support with code: STRIPE_KEY_MISSING',
        code: 'STRIPE_KEY_MISSING'
      }, { status: 503 });
    }

    // Validate key format
    if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
      console.error('Invalid Stripe key format:', stripeKey.substring(0, 10));
      return NextResponse.json({ 
        error: 'Invalid Stripe key format. Must start with sk_live_ or sk_test_',
        code: 'INVALID_STRIPE_KEY'
      }, { status: 503 });
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
      console.error('Booking not found:', bookingId);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Create real Stripe payment intent
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    console.log('Creating payment intent for amount:', amount, 'booking:', bookingId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        bookingId,
        customerId: customerId || booking.customer_id || '',
        braiderId: braiderId || booking.braider_id || '',
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    // Update booking with payment intent ID
    await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending_payment',
      })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}`, code: 'STRIPE_ERROR' },
        { status: 400 }
      );
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { error: 'Stripe authentication failed. Check API key.', code: 'STRIPE_AUTH_ERROR' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to create payment intent', code: 'PAYMENT_ERROR' },
      { status: 500 }
    );
  }
}
