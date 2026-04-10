import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('appointment_date', { ascending: false });

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Get customer and braider names
    const customerIds = [...new Set((bookings || []).map(b => b.customer_id))];
    const braiderIds = [...new Set((bookings || []).map(b => b.braider_id))];

    let customersMap: Record<string, string> = {};
    let braidersMap: Record<string, string> = {};

    if (customerIds.length > 0) {
      const { data: customers } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);

      if (customers) {
        customersMap = Object.fromEntries(customers.map(c => [c.id, c.full_name]));
      }
    }

    if (braiderIds.length > 0) {
      const { data: braiders } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', braiderIds);

      if (braiders) {
        braidersMap = Object.fromEntries(braiders.map(b => [b.id, b.full_name]));
      }
    }

    // Transform bookings with names
    const transformedBookings = (bookings || []).map(b => ({
      ...b,
      customer_name: customersMap[b.customer_id] || 'Unknown',
      braider_name: braidersMap[b.braider_id] || 'Unknown',
    }));

    return NextResponse.json(transformedBookings);
  } catch (error: any) {
    console.error('Admin bookings API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
