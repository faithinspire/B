import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, email, currency } = await request.json();

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 503 });
    }

    const amountInKobo = Math.round(amount * 100); // Paystack uses kobo for NGN
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://braidmee.vercel.app'}/booking/${bookingId}?payment=success`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency: currency || 'NGN',
        reference: `booking_${bookingId}_${Date.now()}`,
        callback_url: callbackUrl,
        metadata: { bookingId },
      }),
    });

    const data = await response.json();
    if (!data.status) {
      return NextResponse.json({ error: data.message || 'Paystack error' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
