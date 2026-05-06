import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface NotifyAdminRequest {
  booking_id: string;
  payment_id: string;
  admin_id: string;
  customer_id: string;
  braider_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
}

export async function POST(request: Request) {
  try {
    const body: NotifyAdminRequest = await request.json();

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Validate required fields
    const requiredFields = [
      'booking_id',
      'payment_id',
      'admin_id',
      'customer_id',
      'braider_id',
      'amount',
      'status',
    ];

    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status: ${body.status}. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Verify booking exists
    const { data: booking, error: bookingError } = await serviceSupabase
      .from('bookings')
      .select('id')
      .eq('id', body.booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: `Booking not found: ${body.booking_id}` },
        { status: 404 }
      );
    }

    // Verify payment_id is unique
    const { data: existingPayment } = await serviceSupabase
      .from('payment_notifications')
      .select('id')
      .eq('payment_id', body.payment_id)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: `Payment already exists: ${body.payment_id}` },
        { status: 400 }
      );
    }

    // Create payment notification
    const paymentNotification = {
      id: `payment_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      booking_id: body.booking_id,
      payment_id: body.payment_id,
      admin_id: body.admin_id,
      customer_id: body.customer_id,
      braider_id: body.braider_id,
      amount: parseFloat(body.amount.toString()),
      status: body.status,
      notification_sent: true,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await serviceSupabase
      .from('payment_notifications')
      .insert([paymentNotification])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment notification:', error);
      return NextResponse.json(
        { error: `Failed to create payment notification: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Payment notification created successfully:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Payment notify-admin API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
