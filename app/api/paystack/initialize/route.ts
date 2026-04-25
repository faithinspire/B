import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, email, currency } = await request.json();

    if (!bookingId || !amount || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return NextResponse.json({ error: 'Paystack not configured. Add PAYSTACK_SECRET_KEY to environment.' }, { status: 503 });
    }

    // Paystack uses kobo for NGN (multiply by 100)
    const amountInKobo = Math.round(amount * 100);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://braidmee.vercel.app';
    const callbackUrl = `${appUrl}/booking/${bookingId}?payment=success&ref={reference}`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency: currency || 'NGN',
        reference: `bm_${bookingId}_${Date.now()}`,
        callback_url: callbackUrl,
        metadata: {
          bookingId,
          custom_fields: [
            { display_name: 'Booking ID', variable_name: 'booking_id', value: bookingId },
          ],
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack error:', data);
      return NextResponse.json({ error: data.message || 'Paystack initialization failed' }, { status: 400 });
    }

    // Store reference in booking
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );
    await supabase
      .from('bookings')
      .update({ paystack_reference: data.data.reference, status: 'pending_payment' })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error: any) {
    console.error('Paystack initialize error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
