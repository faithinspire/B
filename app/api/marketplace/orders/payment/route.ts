import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Payment Processing API for Marketplace Orders
 * Routes payments based on seller country:
 * - Nigeria (NG): Paystack
 * - USA (US): Stripe
 * - Others: Stripe
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      order_id,
      payment_method,
      seller_country,
      amount,
      currency,
      buyer_email,
      buyer_name,
    } = body;

    if (!order_id || !payment_method || !seller_country || !amount) {
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
    let paymentGateway = 'stripe';
    if (seller_country === 'NG') {
      paymentGateway = 'paystack';
    }

    // Update order with payment method
    const { data: updatedOrder, error: updateError } = await db
      .from('marketplace_orders')
      .update({
        payment_method: paymentGateway,
        seller_country,
      })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 400 }
      );
    }

    // Route to appropriate payment gateway
    if (paymentGateway === 'paystack') {
      return handlePaystackPayment({
        order_id,
        amount,
        currency: currency || 'NGN',
        buyer_email,
        buyer_name,
      });
    } else {
      return handleStripePayment({
        order_id,
        amount,
        currency: currency || 'USD',
        buyer_email,
        buyer_name,
      });
    }
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Paystack Payment (Nigeria)
 */
async function handlePaystackPayment({
  order_id,
  amount,
  currency,
  buyer_email,
  buyer_name,
}: {
  order_id: string;
  amount: number;
  currency: string;
  buyer_email: string;
  buyer_name: string;
}) {
  try {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return NextResponse.json(
        { error: 'Paystack not configured' },
        { status: 500 }
      );
    }

    // Convert amount to kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: buyer_email,
        amount: amountInKobo,
        currency: currency,
        metadata: {
          order_id,
          buyer_name,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/marketplace/orders/payment/paystack-callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Paystack initialization failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      gateway: 'paystack',
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error: any) {
    console.error('Paystack payment error:', error);
    return NextResponse.json(
      { error: 'Paystack payment failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe Payment (USA and International)
 */
async function handleStripePayment({
  order_id,
  amount,
  currency,
  buyer_email,
  buyer_name,
}: {
  order_id: string;
  amount: number;
  currency: string;
  buyer_email: string;
  buyer_name: string;
}) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amountInCents.toString(),
        currency: currency.toLowerCase(),
        payment_method_types: 'card',
        metadata: JSON.stringify({
          order_id,
          buyer_name,
          buyer_email,
        }),
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Stripe payment failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      gateway: 'stripe',
      client_secret: data.client_secret,
      payment_intent_id: data.id,
    });
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return NextResponse.json(
      { error: 'Stripe payment failed' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check payment status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing order_id' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: order, error } = await db
      .from('marketplace_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
      },
    });
  } catch (error: any) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
