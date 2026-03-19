import Stripe from 'stripe';

function getStripeInstance(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(key, {
    apiVersion: '2023-10-16',
  });
}

// Named export for direct use (e.g. webhook)
export const stripe = {
  webhooks: {
    constructEvent: (body: string, signature: string, secret: string) => {
      return getStripeInstance().webhooks.constructEvent(body, signature, secret);
    },
  },
};

export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId?: string,
  metadata?: Record<string, any>
) {
  try {
    const stripe = getStripeInstance();
    // Note: customerId here is our app user ID, NOT a Stripe customer ID
    // We pass it only in metadata, not as the Stripe customer param
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method_types: ['card'],
      metadata: {
        ...metadata,
        app_customer_id: customerId || '',
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw error;
  }
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const stripe = getStripeInstance();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      chargeId: (paymentIntent as any).charges?.data?.[0]?.id,
    };
  } catch (error) {
    console.error('Failed to confirm payment intent:', error);
    throw error;
  }
}

export async function createConnectAccount(
  email: string,
  fullName: string,
  country: string = 'US'
) {
  try {
    const stripe = getStripeInstance();
    const account = await stripe.accounts.create({
      type: 'express',
      country: country as any,
      email,
      business_profile: {
        name: fullName,
      },
    });

    return {
      success: true,
      accountId: account.id,
    };
  } catch (error) {
    console.error('Failed to create Connect account:', error);
    throw error;
  }
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) {
  try {
    const stripe = getStripeInstance();
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });

    return {
      success: true,
      url: accountLink.url,
    };
  } catch (error) {
    console.error('Failed to create account link:', error);
    throw error;
  }
}

export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  sourceTransactionId: string,
  currency: string = 'usd'
) {
  try {
    const stripe = getStripeInstance();
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency,
      destination: destinationAccountId,
      metadata: {
        sourceTransactionId,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      transferId: transfer.id,
      status: (transfer as any).status,
    };
  } catch (error) {
    console.error('Failed to create transfer:', error);
    throw error;
  }
}

export async function createPayout(
  accountId: string,
  amount: number,
  currency: string = 'usd'
) {
  try {
    const stripe = getStripeInstance();
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100),
        currency,
        method: 'instant',
      },
      {
        stripeAccount: accountId,
      }
    );

    return {
      success: true,
      payoutId: payout.id,
      status: (payout as any).status,
      arrivalDate: (payout as any).arrival_date,
    };
  } catch (error) {
    console.error('Failed to create payout:', error);
    throw error;
  }
}

export async function refundCharge(
  chargeId: string,
  amount?: number,
  reason?: string
) {
  try {
    const stripe = getStripeInstance();
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason as any,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      refundId: refund.id,
      status: (refund as any).status,
      amount: (refund as any).amount / 100,
    };
  } catch (error) {
    console.error('Failed to refund charge:', error);
    throw error;
  }
}

export async function getAccountBalance(accountId: string) {
  try {
    const stripe = getStripeInstance();
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    return {
      success: true,
      available: (balance as any).available?.[0]?.amount || 0,
      pending: (balance as any).pending?.[0]?.amount || 0,
    };
  } catch (error) {
    console.error('Failed to get account balance:', error);
    throw error;
  }
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
) {
  try {
    const stripe = getStripeInstance();
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  onSuccess: (data: {
    paymentIntentId: string;
    chargeId: string;
    amount: number;
    metadata: Record<string, any>;
  }) => Promise<void>
) {
  try {
    const chargeId = (paymentIntent as any).charges?.data?.[0]?.id;
    if (!chargeId) throw new Error('No charge found');

    await onSuccess({
      paymentIntentId: paymentIntent.id,
      chargeId,
      amount: paymentIntent.amount / 100,
      metadata: paymentIntent.metadata || {},
    });
  } catch (error) {
    console.error('Failed to handle payment intent succeeded:', error);
    throw error;
  }
}

export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  onFailure: (data: {
    paymentIntentId: string;
    reason: string;
    metadata: Record<string, any>;
  }) => Promise<void>
) {
  try {
    await onFailure({
      paymentIntentId: paymentIntent.id,
      reason: (paymentIntent as any).last_payment_error?.message || 'Payment failed',
      metadata: paymentIntent.metadata || {},
    });
  } catch (error) {
    console.error('Failed to handle payment intent failed:', error);
    throw error;
  }
}

export async function handleChargeRefunded(
  charge: Stripe.Charge,
  onRefund: (data: {
    chargeId: string;
    refundAmount: number;
    reason: string;
    metadata: Record<string, any>;
  }) => Promise<void>
) {
  try {
    await onRefund({
      chargeId: charge.id,
      refundAmount: (charge as any).amount_refunded / 100,
      reason: (charge as any).refunded ? 'Full refund' : 'Partial refund',
      metadata: charge.metadata || {},
    });
  } catch (error) {
    console.error('Failed to handle charge refunded:', error);
    throw error;
  }
}
