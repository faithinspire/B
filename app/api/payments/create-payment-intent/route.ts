import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Universal payment intent creation endpoint
 * Routes to Stripe (USD) or Paystack (NGN) based on:
 * 1. User's country from profile
 * 2. Currency of the booking
 * 3. Amount in specific currency
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, amount, currency, customerId, braiderId } = body;

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId and amount' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
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

    // Step 1: Get booking details
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

    // Step 2: Get customer profile to determine country
    const { data: customerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('country, phone_country')
      .eq('id', booking.customer_id)
      .single();

    if (profileError) {
      console.error('Customer profile not found:', booking.customer_id);
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Step 3: Determine payment method based on currency or country
    let paymentMethod = 'stripe';
    let finalCurrency = currency || 'USD';

    // If currency is explicitly NGN, use Paystack
    if (currency === 'NGN') {
      paymentMethod = 'paystack';
      finalCurrency = 'NGN';
    }
    // If currency is USD, use Stripe
    else if (currency === 'USD') {
      paymentMethod = 'stripe';
      finalCurrency = 'USD';
    }
    // If no currency specified, check user's country
    else {
      const userCountry = customerProfile?.country || customerProfile?.phone_country || 'NG';
      
      if (userCountry === 'NG') {
        paymentMethod = 'paystack';
        finalCurrency = 'NGN';
      } else if (userCountry === 'US') {
        paymentMethod = 'stripe';
        finalCurrency = 'USD';
      } else {
        // Default to Stripe for other countries
        paymentMethod = 'stripe';
        finalCurrency = 'USD';
      }
    }

    console.log('Payment routing:', {
      bookingId,
      amount,
      currency: finalCurrency,
      paymentMethod,
      userCountry: customerProfile?.country,
    });

    // Step 4: Route to appropriate payment gateway
    if (paymentMethod === 'paystack') {
      return await createPaystackPayment(
        supabase,
        bookingId,
        amount,
        finalCurrency,
        booking,
        customerId,
        braiderId
      );
    } else {
      return await createStripePayment(
        supabase,
        bookingId,
        amount,
        finalCurrency,
        booking,
        customerId,
        braiderId
      );
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    );
  }
}

/**
 * Create Stripe payment intent (USD)
 */
async function createStripePayment(
  supabase: any,
  bookingId: string,
  amount: number,
  currency: string,
  booking: any,
  customerId?: string,
  braiderId?: string
) {
  const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();

  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY not configured');
    return NextResponse.json(
      {
        error: 'Stripe payment not configured. Contact support.',
        code: 'STRIPE_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
    console.error('Invalid Stripe key format');
    return NextResponse.json(
      {
        error: 'Invalid Stripe configuration',
        code: 'INVALID_STRIPE_KEY',
      },
      { status: 503 }
    );
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

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

    console.log('Stripe payment intent created:', paymentIntent.id);

    // Update booking with payment method and intent ID
    await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_method: 'stripe',
        currency: 'USD',
        status: 'pending_payment',
      })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      paymentMethod: 'stripe',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      currency: 'USD',
    });
  } catch (error: any) {
    console.error('Stripe error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}`, code: 'STRIPE_ERROR' },
        { status: 400 }
      );
    }

    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { error: 'Stripe authentication failed', code: 'STRIPE_AUTH_ERROR' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Stripe payment failed', code: 'STRIPE_PAYMENT_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Create Paystack payment (NGN)
 */
async function createPaystackPayment(
  supabase: any,
  bookingId: string,
  amount: number,
  currency: string,
  booking: any,
  customerId?: string,
  braiderId?: string
) {
  const paystackKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();

  if (!paystackKey) {
    console.error('PAYSTACK_SECRET_KEY not configured');
    return NextResponse.json(
      {
        error: 'Paystack payment not configured. Contact support.',
        code: 'PAYSTACK_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  try {
    // Get customer email for Paystack
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.customer_id)
      .single();

    if (!customerProfile?.email) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Create Paystack payment reference
    const reference = `${bookingId}-${Date.now()}`;

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerProfile.email,
        amount: Math.round(amount * 100), // Paystack uses kobo (1/100 of naira)
        reference,
        metadata: {
          bookingId,
          customerId: customerId || booking.customer_id || '',
          braiderId: braiderId || booking.braider_id || '',
          customerName: customerProfile.full_name || 'Customer',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Paystack error:', error);
      return NextResponse.json(
        { error: `Paystack error: ${error.message}`, code: 'PAYSTACK_ERROR' },
        { status: 400 }
      );
    }

    const paystackData = await response.json();

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return NextResponse.json(
        { error: 'Failed to initialize Paystack payment', code: 'PAYSTACK_INIT_ERROR' },
        { status: 500 }
      );
    }

    console.log('Paystack payment initialized:', reference);

    // Update booking with payment method and reference
    await supabase
      .from('bookings')
      .update({
        paystack_reference: reference,
        payment_method: 'paystack',
        currency: 'NGN',
        status: 'pending_payment',
      })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      paymentMethod: 'paystack',
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
      currency: 'NGN',
    });
  } catch (error: any) {
    console.error('Paystack payment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Paystack payment failed', code: 'PAYSTACK_PAYMENT_ERROR' },
      { status: 500 }
    );
  }
}
