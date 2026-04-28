import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * PAYMENT STRUCTURE REBUILD
 * Creates payment intent based on braider/product country
 * - USA/USD → Stripe
 * - Nigeria/NGN → Paystack
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      bookingId, 
      customerId, 
      braiderCountry, 
      amount, 
      currency,
      paymentType = 'booking' // booking, marketplace, service
    } = body;

    if (!bookingId || !customerId || !braiderCountry || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, customerId, braiderCountry, amount' },
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

    // Determine payment provider based on country
    if (braiderCountry === 'US') {
      // STRIPE PAYMENT
      return await createStripePayment(
        supabase,
        bookingId,
        customerId,
        amount,
        paymentType
      );
    } else if (braiderCountry === 'NG') {
      // PAYSTACK PAYMENT
      return await createPaystackPayment(
        supabase,
        bookingId,
        customerId,
        amount,
        paymentType
      );
    } else {
      // Default to Stripe for other countries
      return await createStripePayment(
        supabase,
        bookingId,
        customerId,
        amount,
        paymentType
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
 * Create Stripe payment intent for USD payments
 */
async function createStripePayment(
  supabase: any,
  bookingId: string,
  customerId: string,
  amount: number,
  paymentType: string
) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Amount in cents for USD
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        bookingId,
        customerId,
        paymentType,
        country: 'US',
      },
    });

    // Store payment record in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        customer_id: customerId,
        amount,
        currency: 'USD',
        status: 'pending',
        payment_type: paymentType,
        payment_provider: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Failed to store payment record:', dbError);
      throw new Error(`Failed to store payment: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      provider: 'stripe',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amountInCents,
      currency: 'usd',
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Stripe payment error:', error);
    throw error;
  }
}

/**
 * Create Paystack payment for NGN payments
 */
async function createPaystackPayment(
  supabase: any,
  bookingId: string,
  customerId: string,
  amount: number,
  paymentType: string
) {
  try {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      throw new Error('Paystack key not configured');
    }

    // Amount in kobo for NGN (1 NGN = 100 kobo)
    const amountInKobo = Math.round(amount * 100);

    // Create Paystack payment
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerId, // Use customer ID or fetch email from database
        amount: amountInKobo,
        metadata: {
          bookingId,
          customerId,
          paymentType,
          country: 'NG',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.status) {
      throw new Error(`Paystack error: ${data.message}`);
    }

    // Store payment record in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        customer_id: customerId,
        amount,
        currency: 'NGN',
        status: 'pending',
        payment_type: paymentType,
        payment_provider: 'paystack',
        paystack_reference: data.data.reference,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Failed to store payment record:', dbError);
      throw new Error(`Failed to store payment: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      provider: 'paystack',
      reference: data.data.reference,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      amount: amountInKobo,
      currency: 'NGN',
      status: 'pending',
    });
  } catch (error) {
    console.error('Paystack payment error:', error);
    throw error;
  }
}
