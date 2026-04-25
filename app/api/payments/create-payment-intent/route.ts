import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, amount, currency, customer_id, braider_id, braider_country } = body;

    if (!booking_id || !amount || !customer_id || !braider_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Determine payment gateway based on country
    const country = braider_country || 'NG';
    const isNigeria = country === 'NG';

    if (isNigeria) {
      // Use Paystack for Nigeria
      return await handlePaystackPayment(db, booking_id, amount, customer_id, braider_id);
    } else {
      // Use Stripe for USA and other countries
      return await handleStripePayment(db, booking_id, amount, currency || 'USD', customer_id, braider_id);
    }
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}

async function handleStripePayment(
  db: any,
  booking_id: string,
  amount: number,
  currency: string,
  customer_id: string,
  braider_id: string
) {
  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        booking_id,
        customer_id,
        braider_id,
      },
    });

    // Update booking with Stripe payment intent ID
    await db
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending_payment',
      })
      .eq('id', booking_id);

    return NextResponse.json(
      {
        success: true,
        payment_method: 'stripe',
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return NextResponse.json(
      { error: `Stripe error: ${error?.message}` },
      { status: 500 }
    );
  }
}

async function handlePaystackPayment(
  db: any,
  booking_id: string,
  amount: number,
  customer_id: string,
  braider_id: string
) {
  try {
    // Get customer email
    const { data: customer } = await db
      .from('profiles')
      .select('email')
      .eq('id', customer_id)
      .single();

    if (!customer?.email) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customer.email,
        amount: Math.round(amount * 100), // Paystack uses kobo (1/100 of naira)
        metadata: {
          booking_id,
          customer_id,
          braider_id,
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || 'Failed to initialize Paystack payment' },
        { status: 400 }
      );
    }

    // Update booking with Paystack reference
    await db
      .from('bookings')
      .update({
        paystack_reference: data.data.reference,
        status: 'pending_payment',
      })
      .eq('id', booking_id);

    return NextResponse.json(
      {
        success: true,
        payment_method: 'paystack',
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Paystack payment error:', error);
    return NextResponse.json(
      { error: `Paystack error: ${error?.message}` },
      { status: 500 }
    );
  }
}
