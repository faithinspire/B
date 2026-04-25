import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const bookingId = searchParams.get('bookingId');

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 503 });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${paystackKey}` },
    });

    const data = await response.json();
    if (!data.status || data.data?.status !== 'success') {
      return NextResponse.json({ error: 'Payment not verified', status: data.data?.status }, { status: 400 });
    }

    // Update booking status
    if (bookingId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        { auth: { persistSession: false } }
      );
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', paystack_reference: reference })
        .eq('id', bookingId);
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
