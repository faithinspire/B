import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const booking_id = searchParams.get('id');

    if (!booking_id) {
      return NextResponse.json({ error: 'booking id is required' }, { status: 400 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data, error } = await db
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
      'customer_id',
      'customer_name',
      'braider_id',
      'braider_name',
      'service_id',
      'service_name',
      'service_price',
      'appointment_date',
      'location_address',
      'status',
      'total_amount',
      'platform_fee',
      'braider_payout',
    ];

    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Parse appointment_date - it could be a combined datetime or separate date/time
    let appointmentDate: string;
    let appointmentTime: string;

    if (body.appointment_date && body.appointment_date.includes('T')) {
      // Combined datetime format: "2024-03-15T14:30"
      const [date, time] = body.appointment_date.split('T');
      appointmentDate = date;
      appointmentTime = time;
    } else if (body.appointment_date && body.appointment_time) {
      // Separate date and time
      appointmentDate = body.appointment_date;
      appointmentTime = body.appointment_time;
    } else {
      return NextResponse.json(
        { error: 'Invalid appointment_date format' },
        { status: 400 }
      );
    }

    // Create booking object
    const booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customer_id: body.customer_id,
      customer_name: body.customer_name,
      braider_id: body.braider_id,
      braider_name: body.braider_name,
      service_id: body.service_id,
      service_name: body.service_name,
      service_price: parseFloat(body.service_price),
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      location_address: body.location_address,
      notes: body.notes || '',
      status: body.status,
      total_amount: parseFloat(body.total_amount),
      platform_fee: parseFloat(body.platform_fee),
      braider_payout: parseFloat(body.braider_payout),
      escrow_released: body.escrow_released || false,
      stripe_payment_intent_id: body.stripe_payment_intent_id || null,
      stripe_charge_id: body.stripe_charge_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Creating booking:', booking);

    // Insert booking
    const { data, error } = await serviceSupabase
      .from('bookings')
      .insert([booking])
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json(
        { error: `Failed to create booking: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Booking created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Bookings API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

