import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * Verify Stripe Payment Intent
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey || (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_'))) {
      return NextResponse.json(
        { success: false, error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const statusMap: Record<string, 'pending' | 'success' | 'failed'> = {
      'succeeded': 'success',
      'canceled': 'failed',
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'pending',
    };

    return NextResponse.json({
      success: paymentIntent.status === 'succeeded',
      verification: {
        status: statusMap[paymentIntent.status] || 'pending',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        reference: paymentIntent.id,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error: any) {
    console.error('Stripe verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
