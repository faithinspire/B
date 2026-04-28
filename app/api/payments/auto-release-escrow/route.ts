import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * PHASE 3: ESCROW AUTO-RELEASE
 * Automatically releases escrow funds 48 hours after booking completion
 * Called by scheduled job (Vercel Cron) or manually
 * 
 * CRITICAL: This ensures braiders receive payment automatically
 */

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Find all bookings that are:
    // 1. Status = 'completed' (braiding finished)
    // 2. escrow_released = false (not yet released)
    // 3. updated_at > 48 hours ago (auto-release window passed)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: bookingsToRelease, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'completed')
      .eq('escrow_released', false)
      .lt('updated_at', fortyEightHoursAgo);

    if (fetchError) {
      console.error('Error fetching bookings for escrow release:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookingsToRelease || bookingsToRelease.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings eligible for escrow release',
        released: 0,
      });
    }

    console.log(`Found ${bookingsToRelease.length} bookings eligible for escrow release`);

    let releasedCount = 0;
    const errors: any[] = [];

    // Release escrow for each booking
    for (const booking of bookingsToRelease) {
      try {
        // Update booking to mark escrow as released
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            escrow_released: true,
            escrow_released_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`Error releasing escrow for booking ${booking.id}:`, updateError);
          errors.push({
            bookingId: booking.id,
            error: updateError.message,
          });
          continue;
        }

        // Create payment record for braider
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            booking_id: booking.id,
            braider_id: booking.braider_id,
            customer_id: booking.customer_id,
            amount: booking.braider_payout,
            currency: booking.currency,
            status: 'completed',
            payment_type: 'escrow_release',
            description: `Escrow release for booking ${booking.id}`,
            created_at: new Date().toISOString(),
          });

        if (paymentError) {
          console.error(`Error creating payment record for booking ${booking.id}:`, paymentError);
          errors.push({
            bookingId: booking.id,
            error: `Payment record creation failed: ${paymentError.message}`,
          });
          continue;
        }

        // Create notification for braider
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: booking.braider_id,
            type: 'payment_released',
            title: 'Payment Released',
            message: `Your payment of ${booking.braider_payout} ${booking.currency} has been released for booking ${booking.id.substring(0, 8)}...`,
            data: {
              bookingId: booking.id,
              amount: booking.braider_payout,
              currency: booking.currency,
            },
            is_read: false,
            created_at: new Date().toISOString(),
          });

        if (notificationError) {
          console.error(`Error creating notification for braider ${booking.braider_id}:`, notificationError);
          // Don't fail the whole operation if notification fails
        }

        releasedCount++;
        console.log(`✅ Escrow released for booking ${booking.id}: ${booking.braider_payout} ${booking.currency}`);
      } catch (error) {
        console.error(`Unexpected error processing booking ${booking.id}:`, error);
        errors.push({
          bookingId: booking.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Escrow release completed`,
      released: releasedCount,
      total: bookingsToRelease.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Escrow auto-release error:', error);
    return NextResponse.json(
      { error: 'Failed to process escrow release' },
      { status: 500 }
    );
  }
}
