import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ── Payment routing: country → currency + provider ────────────────────────
const COUNTRY_PAYMENT: Record<string, { currency: string; provider: string; symbol: string }> = {
  NG: { currency: 'NGN', provider: 'paystack', symbol: '₦' },
  US: { currency: 'USD', provider: 'stripe',   symbol: '$' },
};

function getPaymentInfo(country: string) {
  return COUNTRY_PAYMENT[country?.toUpperCase()] ?? COUNTRY_PAYMENT['NG'];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const booking_id = searchParams.get('id');
    const customer_id = searchParams.get('customer_id');

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { persistSession: false } }
    );

    if (booking_id) {
      const { data, error } = await db.from('bookings').select('*').eq('id', booking_id).single();
      if (error || !data) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      return NextResponse.json(data);
    }

    if (customer_id) {
      const { data, error } = await db
        .from('bookings')
        .select('*')
        .eq('customer_id', customer_id)
        .order('created_at', { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ error: 'booking id or customer_id is required' }, { status: 400 });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // ── Validate required fields ──────────────────────────────────────────
    const required = ['customer_id', 'braider_id', 'service_name', 'service_price', 'appointment_date', 'status'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // ── Parse appointment date/time ───────────────────────────────────────
    let appointmentDate: string;
    let appointmentTime: string;

    if (body.appointment_date?.includes('T')) {
      const [date, time] = body.appointment_date.split('T');
      appointmentDate = date;
      appointmentTime = time || '09:00';
    } else if (body.appointment_date && body.appointment_time) {
      appointmentDate = body.appointment_date;
      appointmentTime = body.appointment_time;
    } else {
      return NextResponse.json({ error: 'Invalid appointment_date format' }, { status: 400 });
    }

    // ── Determine braider country → payment routing ───────────────────────
    // Priority: body.braider_country → fetch from braider_profiles → default NG
    let braiderCountry = body.braider_country || null;

    if (!braiderCountry) {
      const { data: bp } = await db
        .from('braider_profiles')
        .select('country')
        .eq('user_id', body.braider_id)
        .single();
      braiderCountry = bp?.country || null;
    }

    if (!braiderCountry) {
      // Try profiles table as fallback
      const { data: prof } = await db
        .from('profiles')
        .select('country')
        .eq('id', body.braider_id)
        .single();
      braiderCountry = prof?.country || 'NG';
    }

    const payment = getPaymentInfo(braiderCountry);

    console.log(`=== BOOKING: braider country=${braiderCountry}, currency=${payment.currency}, provider=${payment.provider} ===`);

    // ── Build booking object ──────────────────────────────────────────────
    const servicePrice = parseFloat(body.service_price) || 0;
    const totalAmount  = parseFloat(body.total_amount)  || servicePrice;
    const platformFee  = parseFloat(body.platform_fee)  || totalAmount * 0.1;
    const braiderPayout = parseFloat(body.braider_payout) || totalAmount * 0.9;

    const bookingId = body.id || `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // ── FULL booking object (all columns) ─────────────────────────────────
    const fullBooking: Record<string, any> = {
      id: bookingId,
      customer_id: body.customer_id,
      customer_name: body.customer_name || 'Customer',
      braider_id: body.braider_id,
      braider_name: body.braider_name || '',
      service_id: body.service_id || null,
      service_name: body.service_name,
      service_price: servicePrice,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      location_address: body.location_address || '',
      notes: body.notes || '',
      status: body.status || 'pending',
      total_amount: totalAmount,
      platform_fee: platformFee,
      braider_payout: braiderPayout,
      // Payment routing columns
      currency: payment.currency,
      payment_provider: payment.provider,
      braider_country: braiderCountry,
      customer_country: body.customer_country || null,
      // Payment intent columns
      stripe_payment_intent_id: body.stripe_payment_intent_id || null,
      stripe_charge_id: body.stripe_charge_id || null,
      paystack_reference: body.paystack_reference || null,
      // Escrow
      escrow_released: body.escrow_released || false,
      escrow_released_at: null,
      auto_release_at: null,
      payment_status: body.payment_status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // ── Try inserting with all columns first ──────────────────────────────
    let { data, error } = await db.from('bookings').insert([fullBooking]).select().single();

    // ── If column-not-found error, strip unknown columns and retry ─────────
    if (error && (error.message?.includes('column') || error.code === '42703')) {
      console.warn('=== BOOKING: Column error, retrying with minimal fields ===', error.message);

      // Minimal booking — only columns that definitely exist in every schema
      const minimalBooking: Record<string, any> = {
        id: bookingId,
        customer_id: body.customer_id,
        customer_name: body.customer_name || 'Customer',
        braider_id: body.braider_id,
        braider_name: body.braider_name || '',
        service_name: body.service_name,
        service_price: servicePrice,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        location_address: body.location_address || '',
        notes: body.notes || '',
        status: body.status || 'pending',
        total_amount: totalAmount,
        platform_fee: platformFee,
        braider_payout: braiderPayout,
        escrow_released: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Selectively add optional columns that may or may not exist
      const optionalColumns: Record<string, any> = {
        currency: payment.currency,
        payment_provider: payment.provider,
        braider_country: braiderCountry,
        stripe_payment_intent_id: null,
        paystack_reference: null,
        payment_status: 'pending',
      };

      // Try adding each optional column one by one
      for (const [col, val] of Object.entries(optionalColumns)) {
        const { error: testErr } = await db.from('bookings').select(col).limit(1);
        if (!testErr) {
          minimalBooking[col] = val;
        }
      }

      const retry = await db.from('bookings').insert([minimalBooking]).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('=== BOOKING: Final insert error ===', error);
      return NextResponse.json(
        { error: `Failed to create booking: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('=== BOOKING: Created successfully ===', data?.id);

    // Return booking with payment info attached
    return NextResponse.json({
      ...data,
      payment_provider: payment.provider,
      currency: payment.currency,
      currency_symbol: payment.symbol,
      braider_country: braiderCountry,
    });
  } catch (error) {
    console.error('Bookings API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
