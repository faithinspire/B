import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { booking_id, raised_by, reason, description, evidence_urls } = await request.json();

    // Validate required fields
    if (!booking_id || !raised_by || !reason || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = ['service_not_delivered', 'quality_issue', 'safety_concern', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid dispute reason' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if dispute already exists
    const { data: existingDispute } = await supabase
      .from('disputes')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('status', 'open');

    if (existingDispute && existingDispute.length > 0) {
      return NextResponse.json(
        { error: 'An open dispute already exists for this booking' },
        { status: 400 }
      );
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .insert({
        booking_id,
        raised_by,
        reason,
        description,
        evidence_urls: evidence_urls || [],
        status: 'open',
      })
      .select()
      .single();

    if (disputeError) {
      console.error('Dispute creation error:', disputeError);
      return NextResponse.json(
        { error: 'Failed to create dispute' },
        { status: 500 }
      );
    }

    // Update booking status to disputed (freezes escrow)
    await supabase
      .from('bookings')
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking_id);

    // Get all admin users
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    // Notify admins of new dispute
    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'dispute_opened',
        title: 'New Dispute',
        body: `A new dispute has been opened for booking ${booking_id}. Reason: ${reason}`,
        data: {
          dispute_id: dispute.id,
          booking_id,
          reason,
        },
      }));

      await supabase
        .from('notifications')
        .insert(adminNotifications);
    }

    // Notify the other party
    const otherUserId = raised_by === booking.customer_id ? booking.braider_id : booking.customer_id;
    
    await supabase
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'dispute_opened',
        title: 'Dispute Opened',
        body: `A dispute has been opened for booking ${booking_id}. Our support team will investigate.`,
        data: {
          dispute_id: dispute.id,
          booking_id,
        },
      });

    // Send email to support team
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@braidly.com',
          to: 'support@braidly.com',
          subject: `New Dispute - Booking ${booking_id}`,
          html: `
            <h2>New Dispute Report</h2>
            <p><strong>Dispute ID:</strong> ${dispute.id}</p>
            <p><strong>Booking ID:</strong> ${booking_id}</p>
            <p><strong>Raised By:</strong> ${raised_by}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Evidence:</strong> ${evidence_urls?.length || 0} files</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/disputes/${dispute.id}">Review Dispute</a></p>
          `,
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      dispute: dispute,
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
