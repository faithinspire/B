import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, amount, customerId, braiderId, email } = body;

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'Missing required fields: bookingId and amount' }, { status: 400 });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    // Get Paystack key
    let paystackKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
    
    if (!paystackKey) {
      console.error('PAYSTACK_SECRET_KEY not found in environment');
      return NextResponse.json({ 
        error: 'Payment system not configured. Contact support with code: PAYSTACK_KEY_MISSING',
        code: 'PAYSTACK_KEY_MISSING'
      }, { status: 503 });
    }

    // Validate key format
    if (!paystackKey.startsWith('ssk_live_') && !paystackKey.startsWith('ssk_test_')) {
      console.error('Invalid Paystack key format:', paystackKey.substring(0, 10));
      return NextResponse.json({ 
        error: 'Invalid Paystack key format. Must start with ssk_live_ or ssk_test_',
        code: 'INVALID_PAYSTACK_KEY'
      }, { status: 503 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingId);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get customer email if not provided
    let customerEmail = email;
    if (!customerEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', customerId || booking.customer_id)
        .single();
      customerEmail = profile?.email || 'customer@braidmee.com';
    }

    // Create Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo (cents)
        metadata: {
          bookingId,
          customerId: customerId || booking.customer_id || '',
          braiderId: braiderId || booking.braider_id || '',
        },
      }),
    });

    if (!paystackResponse.ok) {
      const error = await paystackResponse.json();
      console.error('Paystack error:', error);
      return NextResponse.json(
        { error: `Paystack error: ${error.message || 'Payment initialization failed'}`, code: 'PAYSTACK_ERROR' },
        { status: 400 }
      );
    }

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return NextResponse.json(
        { error: 'Failed to initialize payment', code: 'PAYSTACK_INIT_ERROR' },
        { status: 500 }
      );
    }

    console.log('Paystack payment initialized:', paystackData.data.reference);

    // Update booking with payment reference
    await supabase
      .from('bookings')
      .update({
        paystack_reference: paystackData.data.reference,
        status: 'pending_payment',
      })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
    });
  } catch (error: any) {
    console.error('Paystack payment initialization error:', error);
    
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize payment', code: 'PAYMENT_ERROR' },
      { status: 500 }
    );
  }
}
