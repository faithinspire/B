import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Verify Paystack Payment
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'Paystack not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const result = await response.json();

    if (!result.status) {
      return NextResponse.json(
        { success: false, error: result.message || 'Verification failed' },
        { status: 400 }
      );
    }

    const data = result.data;
    const statusMap: Record<string, 'pending' | 'success' | 'failed'> = {
      'success': 'success',
      'failed': 'failed',
      'abandoned': 'failed',
      'pending': 'pending',
    };

    return NextResponse.json({
      success: data.status === 'success',
      verification: {
        status: statusMap[data.status] || 'pending',
        amount: data.amount / 100,
        currency: data.currency,
        reference: data.reference,
        metadata: data.metadata,
      },
    });
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
