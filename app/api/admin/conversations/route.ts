import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Get all bookings (these are the "conversations" between customers and braiders)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (bookingsError || !bookings) {
      console.error('Bookings error:', bookingsError);
      return NextResponse.json([]);
    }

    // Get customer and braider profiles
    const customerIds = [...new Set(bookings.map(b => b.customer_id))];
    const braiderIds = [...new Set(bookings.map(b => b.braider_id))];
    const allIds = [...new Set([...customerIds, ...braiderIds])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', allIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map(p => [p.id, p])
    );

    // Transform bookings to conversation format
    const result = bookings.map(booking => ({
      id: booking.id,
      booking_id: booking.id,
      customer_id: booking.customer_id,
      braider_id: booking.braider_id,
      customer_name: profileMap[booking.customer_id]?.full_name || 'Unknown Customer',
      braider_name: profileMap[booking.braider_id]?.full_name || 'Unknown Braider',
      status: booking.status,
      appointment_date: booking.appointment_date,
      total_amount: booking.total_amount,
      notes: booking.notes,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json([]);
  }
}
