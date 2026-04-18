/**
 * Central Payment Service for BraidMee
 * Handles both Stripe (US) and Paystack (Nigeria) payments
 */

import Stripe from 'stripe';

// =====================================================
// TYPES
// =====================================================

export interface PaymentResult {
  success: boolean;
  provider: 'stripe' | 'paystack';
  reference: string;
  authorizationUrl?: string;
  clientSecret?: string;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  currency: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface OrderPaymentData {
  orderId: string;
  amount: number;
  currency: string;
  userId: string;
  userEmail: string;
  countryCode: 'NG' | 'US';
  metadata?: Record<string, any>;
}

export interface BookingPaymentData {
  bookingId: string;
  amount: number;
  currency: string;
  customerId: string;
  customerEmail: string;
  braiderId: string;
  braiderName: string;
  countryCode: 'NG' | 'US';
  metadata?: Record<string, any>;
}

// =====================================================
// STRIPE (US PAYMENTS)
// =====================================================

function getStripe(): Stripe | null {
  try {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key || (!key.startsWith('sk_test_') && !key.startsWith('sk_live_'))) {
      console.warn('Stripe not configured or invalid key');
      return null;
    }
    return new Stripe(key, { apiVersion: '2023-10-16' });
  } catch (error) {
    console.error('Stripe initialization error:', error);
    return null;
  }
}

async function initializeStripePayment(data: BookingPaymentData | OrderPaymentData): Promise<PaymentResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, provider: 'stripe', reference: '', error: 'Stripe not configured' };
  }

  try {
    const isBooking = 'bookingId' in data;
    const reference = isBooking 
      ? `booking_${data.bookingId}_${Date.now()}`
      : `order_${(data as OrderPaymentData).orderId}_${Date.now()}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        ...data.metadata,
        reference,
        userId: data.userId,
        userEmail: data.userEmail,
        countryCode: data.countryCode,
        ...(isBooking ? { bookingId: (data as BookingPaymentData).bookingId } : { orderId: (data as OrderPaymentData).orderId }),
      },
    });

    return {
      success: true,
      provider: 'stripe',
      reference: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  } catch (error: any) {
    console.error('Stripe payment initialization error:', error);
    return { success: false, provider: 'stripe', reference: '', error: error.message };
  }
}

async function verifyStripePayment(paymentIntentId: string): Promise<PaymentVerificationResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, status: 'failed', amount: 0, currency: 'usd', reference: paymentIntentId, error: 'Stripe not configured' };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    const statusMap: Record<string, 'pending' | 'success' | 'failed'> = {
      'succeeded': 'success',
      'canceled': 'failed',
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'pending',
    };

    return {
      success: paymentIntent.status === 'succeeded',
      status: statusMap[paymentIntent.status] || 'pending',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      reference: paymentIntent.id,
      metadata: paymentIntent.metadata,
    };
  } catch (error: any) {
    console.error('Stripe verification error:', error);
    return { success: false, status: 'failed', amount: 0, currency: 'usd', reference: paymentIntentId, error: error.message };
  }
}

// =====================================================
// PAYSTACK (NIGERIA PAYMENTS)
// =====================================================

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function initializePaystackPayment(data: BookingPaymentData | OrderPaymentData): Promise<PaymentResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { success: false, provider: 'paystack', reference: '', error: 'Paystack not configured' };
  }

  try {
    const isBooking = 'bookingId' in data;
    const reference = isBooking 
      ? `booking_${data.bookingId}_${Date.now()}`
      : `order_${(data as OrderPaymentData).orderId}_${Date.now()}`;

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.userEmail,
        amount: Math.round(data.amount * 100), // Convert to kobo
        currency: data.currency || 'NGN',
        reference,
        metadata: {
          ...data.metadata,
          userId: data.userId,
          countryCode: data.countryCode,
          ...(isBooking ? { bookingId: (data as BookingPaymentData).bookingId } : { orderId: (data as OrderPaymentData).orderId }),
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://braidmee.com'}/payment/callback`,
      }),
    });

    const result = await response.json();

    if (!result.status) {
      return { success: false, provider: 'paystack', reference: '', error: result.message || 'Paystack initialization failed' };
    }

    return {
      success: true,
      provider: 'paystack',
      reference: result.data.reference,
      authorizationUrl: result.data.authorization_url,
    };
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    return { success: false, provider: 'paystack', reference: '', error: error.message };
  }
}

async function verifyPaystackPayment(reference: string): Promise<PaymentVerificationResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { success: false, status: 'failed', amount: 0, currency: 'NGN', reference, error: 'Paystack not configured' };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const result = await response.json();

    if (!result.status) {
      return { success: false, status: 'failed', amount: 0, currency: 'NGN', reference, error: result.message };
    }

    const data = result.data;
    const statusMap: Record<string, 'pending' | 'success' | 'failed'> = {
      'success': 'success',
      'failed': 'failed',
      'abandoned': 'failed',
      'pending': 'pending',
    };

    return {
      success: data.status === 'success',
      status: statusMap[data.status] || 'pending',
      amount: data.amount / 100,
      currency: data.currency,
      reference: data.reference,
      metadata: data.metadata,
    };
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    return { success: false, status: 'failed', amount: 0, currency: 'NGN', reference, error: error.message };
  }
}

// =====================================================
// MAIN EXPORTS
// =====================================================

/**
 * Initialize payment based on user's country
 * NG → Paystack, US → Stripe
 */
export async function initializePayment(data: BookingPaymentData | OrderPaymentData): Promise<PaymentResult> {
  const countryCode = data.countryCode || 'US';
  
  if (countryCode === 'NG') {
    return initializePaystackPayment(data);
  } else {
    return initializeStripePayment(data);
  }
}

/**
 * Verify payment by provider and reference
 */
export async function verifyPayment(provider: 'stripe' | 'paystack', reference: string): Promise<PaymentVerificationResult> {
  if (provider === 'paystack') {
    return verifyPaystackPayment(reference);
  } else {
    return verifyStripePayment(reference);
  }
}

/**
 * Get public key for frontend
 */
export function getPublicKey(provider: 'stripe' | 'paystack'): string | null {
  if (provider === 'stripe') {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || null;
  } else {
    return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || null;
  }
}

/**
 * Determine payment provider based on country
 */
export function getPaymentProvider(countryCode: string): 'stripe' | 'paystack' {
  return countryCode === 'NG' ? 'paystack' : 'stripe';
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount);
}
