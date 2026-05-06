import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Automatic Escrow Release Job
 * Runs every hour to release escrowed funds after 48 hours of booking completion
 * 
 * Triggered by: Vercel Cron or external scheduler
 * Authorization: Requires CRON_SECRET header
 */

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = request.headers.get('authorization');
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Find all completed bookings where 48 hours have passed
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'completed')
      .eq('escrow_released', false)
      .lt('updated_at', fortyEightHoursAgo.toISOString());

    if (fetchError) {
      console.error('Fetch bookings error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings to release',
        released_count: 0,
      });
    }

    let releasedCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Process each booking
    for (const booking of bookings) {
      try {
        // Capture the payment intent
        if (booking.stripe_payment_intent_id) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            booking.stripe_payment_intent_id
          );

          if (paymentIntent.status === 'requires_capture') {
            await stripe.paymentIntents.confirm(
              booking.stripe_payment_intent_id,
              { payment_method: paymentIntent.payment_method }
            );
          }
        }

        // Get braider's Stripe Connect account
        const { data: braiderProfile } = await supabase
          .from('braider_profiles')
          .select('stripe_account_id')
          .eq('id', booking.braider_id)
          .single();

        if (!braiderProfile?.stripe_account_id) {
          throw new Error('Braider Stripe account not configured');
        }

        // Calculate payout amount (90% to braider, 10% platform fee)
        const platformFee = booking.total_amount * 0.1;
        const payoutAmount = booking.total_amount - platformFee;

        // Transfer funds to braider's Stripe Connect account
        const transfer = await stripe.transfers.create({
          amount: Math.round(payoutAmount * 100), // Convert to cents
          currency: 'usd',
          destination: braiderProfile.stripe_account_id,
          source_transaction: booking.stripe_charge_id,
          description: `Payout for booking ${booking.id}`,
        });

        // Create transaction record
        await supabase
          .from('transactions')
          .insert({
            booking_id: booking.id,
            braider_id: booking.braider_id,
            gross_amount: booking.total_amount,
            platform_commission: platformFee,
            commission_rate: 10,
            net_payout: payoutAmount,
            stripe_transfer_id: transfer.id,
            payout_status: 'paid',
          });

        // Update booking to mark escrow as released
        await supabase
          .from('bookings')
          .update({
            escrow_released: true,
            status: 'released',
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        // Notify braider of payout
        await supabase
          .from('notifications')
          .insert({
            user_id: booking.braider_id,
            type: 'payout_released',
            title: 'Payment Released',
            body: `$${payoutAmount.toFixed(2)} has been transferred to your account for booking ${booking.id}`,
            data: {
              booking_id: booking.id,
              amount: payoutAmount,
              transfer_id: transfer.id,
            },
          });

        releasedCount++;
      } catch (error) {
        console.error(`Error releasing escrow for booking ${booking.id}:`, error);
        failedCount++;
        errors.push({
          booking_id: booking.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Escrow release job completed`,
      total_processed: bookings.length,
      released_count: releasedCount,
      failed_count: failedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Escrow auto-release error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Trigger the POST handler
  return POST(request);
}
