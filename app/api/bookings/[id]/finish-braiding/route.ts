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

    // Get booking details
    const { data: booking, error: fetchError } = await db
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Calculate duration
    const startTime = new Date(booking.started_at);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    // Update booking status
    const { error: updateError } = await db
      .from('bookings')
      .update({
        status: 'completed',
        finished_at: endTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', booking_id);

    if (updateError) throw updateError;

    // Notify admin about completion and payment
    await db.from('notifications').insert({
      user_id: 'admin',
      type: 'braiding_completed',
      title: 'Braiding Completed - Payment Due',
      message: `Braider has finished braiding for booking ${booking_id.substring(0, 8)}... Duration: ${durationMinutes} minutes. Amount: $${booking.amount}. Please process payment.`,
      read: false,
      created_at: new Date().toISOString(),
    });

    // Notify customer
    if (booking.customer_id) {
      await db.from('notifications').insert({
        user_id: booking.customer_id,
        type: 'braiding_completed',
        title: 'Braiding Completed',
        message: `Your braiding is complete! Duration: ${durationMinutes} minutes.`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    // Notify braider
    if (booking.braider_id) {
      await db.from('notifications').insert({
        user_id: booking.braider_id,
        type: 'braiding_completed',
        title: 'Braiding Completed',
        message: `You have completed braiding. Duration: ${durationMinutes} minutes. Payment will be processed by admin.`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Braiding finished',
      duration_minutes: durationMinutes,
    });
  } catch (error: any) {
    console.error('Finish braiding error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to finish braiding' },
      { status: 500 }
    );
  }
}
