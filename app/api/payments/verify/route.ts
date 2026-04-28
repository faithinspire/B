import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * Payment Verification Endpoint
 * Verifies payment status for both Stripe and Paystack
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, provider } = body;

    if (!paymentId || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, provider' },
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

    if (provider === 'stripe') {
      return await verifyStripePayment(supabase, paymentId);
    } else if (provider === 'paystack') {
      return await verifyPaystackPayment(supabase, paymentId);
    } else {
      return NextResponse.json(
        { error: 'Invalid payment provider' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}

/**
 * Verify Stripe payment
 */
async function verifyStripePayment(supabase: any, paymentIntentId: string) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update payment record with latest status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
    }

    return NextResponse.json({
      success: true,
      provider: 'stripe',
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error('Stripe verification error:', error);
    throw error;
  }
}

/**
 * Verify Paystack payment
 */
async function verifyPaystackPayment(supabase: any, reference: string) {
  try {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      throw new Error('Paystack key not configured');
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.status) {
      throw new Error(`Paystack error: ${data.message}`);
    }

    const transactionData = data.data;

    // Update payment record with latest status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: transactionData.status === 'success' ? 'completed' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('paystack_reference', reference);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
    }

    return NextResponse.json({
      success: true,
      provider: 'paystack',
      status: transactionData.status,
      amount: transactionData.amount,
      currency: 'NGN',
      reference: transactionData.reference,
      metadata: transactionData.metadata,
    });
  } catch (error) {
    console.error('Paystack verification error:', error);
    throw error;
  }
}
