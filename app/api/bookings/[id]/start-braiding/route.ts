import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { braider_id } = await request.json();
    const booking_id = params.id;

    if (!booking_id || !braider_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Update booking status
    const { error: updateError } = await db
      .from('bookings')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', booking_id);

    if (updateError) throw updateError;

    // Get booking details for notification
    const { data: booking } = await db
      .from('bookings')
      .select('customer_id, braider_id')
      .eq('id', booking_id)
      .single();

    // Notify admin
    await db.from('notifications').insert({
      user_id: 'admin', // This should be the admin user ID
      type: 'braiding_started',
      title: 'Braiding Started',
      message: `Braider has started braiding for booking ${booking_id.substring(0, 8)}...`,
      read: false,
      created_at: new Date().toISOString(),
    });

    // Notify customer
    if (booking?.customer_id) {
      await db.from('notifications').insert({
        user_id: booking.customer_id,
        type: 'braiding_started',
        title: 'Braiding Started',
        message: 'Your braider has started working on your hair.',
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Braiding started',
    });
  } catch (error: any) {
    console.error('Start braiding error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to start braiding' },
      { status: 500 }
    );
  }
}
