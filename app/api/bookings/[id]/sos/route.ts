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

    const { user_id, location, incident_type, description } = await request.json();
    const bookingId = params.id;

    if (!bookingId || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Create incident report
    const { data: incident, error: incidentError } = await supabase
      .from('incident_reports')
      .insert({
        booking_id: bookingId,
        reported_by: user_id,
        incident_type: incident_type || 'emergency',
        description: description || 'SOS Emergency Alert',
        location: location ? `POINT(${location.lng} ${location.lat})` : null,
        status: 'reported',
      })
      .select()
      .single();

    if (incidentError) {
      console.error('Incident creation error:', incidentError);
      return NextResponse.json(
        { error: 'Failed to create incident report' },
        { status: 500 }
      );
    }

    // Get all admin users
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    // Send emergency notifications to all admins
    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'emergency_alert',
        title: '🚨 Emergency Alert',
        body: `SOS emergency reported for booking ${bookingId}. Location: ${location ? `${location.lat}, ${location.lng}` : 'Unknown'}`,
        data: {
          booking_id: bookingId,
          incident_id: incident.id,
          reported_by: user_id,
          location,
        },
      }));

      await supabase
        .from('notifications')
        .insert(adminNotifications);
    }

    // Notify the other party (customer or braider)
    const otherUserId = user_id === booking.customer_id ? booking.braider_id : booking.customer_id;
    
    await supabase
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'emergency_alert',
        title: '🚨 Emergency Alert',
        body: 'An emergency has been reported for your booking. Support team has been notified.',
        data: {
          booking_id: bookingId,
          incident_id: incident.id,
        },
      });

    // Update booking status to flag emergency
    await supabase
      .from('bookings')
      .update({
        status: 'disputed', // Mark as disputed to freeze funds
      })
      .eq('id', bookingId);

    // Send email to support team (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@braidme.com',
          to: 'support@braidme.com',
          subject: '🚨 URGENT: Emergency Alert - Immediate Action Required',
          html: `
            <h2>Emergency Alert</h2>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Reported By:</strong> ${user_id}</p>
            <p><strong>Incident Type:</strong> ${incident_type || 'Emergency'}</p>
            <p><strong>Description:</strong> ${description || 'SOS Emergency Alert'}</p>
            <p><strong>Location:</strong> ${location ? `${location.lat}, ${location.lng}` : 'Unknown'}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/incidents/${incident.id}">View Incident Details</a></p>
          `,
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      incident_id: incident.id,
      message: 'Emergency alert sent. Support team has been notified.',
    });
  } catch (error) {
    console.error('SOS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
