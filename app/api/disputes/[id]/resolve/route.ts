import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { resolution_type, admin_notes, resolved_by } = await request.json();
    const disputeId = params.id;

    // Validate required fields
    if (!disputeId || !resolution_type || !resolved_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate resolution type
    const validResolutions = ['resolved_refund', 'resolved_partial', 'resolved_released'];
    if (!validResolutions.includes(resolution_type)) {
      return NextResponse.json(
        { error: 'Invalid resolution type' },
        { status: 400 }
      );
    }

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (disputeError || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', dispute.booking_id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let refundAmount = 0;
    let newBookingStatus = 'completed';

    // Process resolution
    if (resolution_type === 'resolved_refund') {
      // Full refund to customer
      refundAmount = booking.total_amount;
      newBookingStatus = 'refunded';

      if (booking.stripe_charge_id) {
        try {
          await stripe.refunds.create({
            charge: booking.stripe_charge_id,
            amount: Math.round(refundAmount * 100),
          });
        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError);
        }
      }
    } else if (resolution_type === 'resolved_partial') {
      // 50% refund to customer
      refundAmount = booking.total_amount * 0.5;
      newBookingStatus = 'completed';

      if (booking.stripe_charge_id) {
        try {
          await stripe.refunds.create({
            charge: booking.stripe_charge_id,
            amount: Math.round(refundAmount * 100),
          });
        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError);
        }
      }
    } else if (resolution_type === 'resolved_released') {
      // Release full payment to braider
      newBookingStatus = 'completed';
    }

    // Update dispute status
    const { error: updateDisputeError } = await supabase
      .from('disputes')
      .update({
        status: resolution_type,
        admin_notes,
        resolved_by,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId);

    if (updateDisputeError) {
      return NextResponse.json(
        { error: 'Failed to update dispute' },
        { status: 500 }
      );
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: newBookingStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispute.booking_id);

    // Notify customer
    await supabase
      .from('notifications')
      .insert({
        user_id: booking.customer_id,
        type: 'dispute_resolved',
        title: 'Dispute Resolved',
        body: `Your dispute has been resolved. ${refundAmount > 0 ? `$${refundAmount.toFixed(2)} has been refunded.` : 'No refund was issued.'}`,
        data: {
          dispute_id: disputeId,
          booking_id: dispute.booking_id,
          refund_amount: refundAmount,
        },
      });

    // Notify braider
    await supabase
      .from('notifications')
      .insert({
        user_id: booking.braider_id,
        type: 'dispute_resolved',
        title: 'Dispute Resolved',
        body: `A dispute for booking ${dispute.booking_id} has been resolved.`,
        data: {
          dispute_id: disputeId,
          booking_id: dispute.booking_id,
        },
      });

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        admin_id: resolved_by,
        action: 'dispute_resolved',
        target_type: 'dispute',
        target_id: disputeId,
        details: {
          resolution_type,
          refund_amount: refundAmount,
          booking_id: dispute.booking_id,
        },
      });

    return NextResponse.json({
      success: true,
      dispute_id: disputeId,
      resolution_type,
      refund_amount: refundAmount,
      booking_status: newBookingStatus,
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
