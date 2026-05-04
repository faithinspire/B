import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, buildVerificationSubmittedEmail } from '@/app/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      full_name,
      phone,
      location_country,
      location_state,
      location_city,
      years_experience,
      specialization,
      id_document_type,
      id_number,
      id_document_url,
      selfie_url,
    } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!full_name || !phone || !id_document_type || !id_number || !id_document_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user email for sending confirmation
    const { data: { user } } = await supabase.auth.admin.getUserById(session.user.id);
    const userEmail = user?.email;

    if (!userEmail) {
      console.error('[verification-submit] ❌ User email not found');
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Upsert verification record
    const { data: verification, error: verificationError } = await supabase
      .from('braider_verification')
      .upsert({
        user_id: session.user.id,
        full_name,
        phone,
        location_country,
        location_state,
        location_city,
        years_experience: parseInt(years_experience),
        specialization,
        id_document_type,
        id_number,
        id_document_url,
        selfie_url: selfie_url || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (verificationError) {
      throw verificationError;
    }

    // Create notification for braider
    await supabase
      .from('verification_notifications')
      .insert({
        user_id: session.user.id,
        type: 'submitted',
        title: 'Verification Submitted',
        message: 'Your verification has been submitted. An admin will review your documents within 24-48 hours.',
        is_read: false,
      });

    // Create audit log
    await supabase
      .from('verification_audit_log')
      .insert({
        user_id: session.user.id,
        action: 'submitted',
        new_status: 'pending',
        reason: 'Braider submitted verification documents',
      });

    // Send confirmation email via Resend
    console.log('[verification-submit] Sending confirmation email to:', userEmail);
    const emailResult = await sendEmail({
      to: userEmail,
      subject: 'Verification Submitted - BraidMe',
      html: buildVerificationSubmittedEmail(full_name),
    });

    if (!emailResult.success) {
      console.error('[verification-submit] ⚠️ Failed to send confirmation email:', emailResult.error);
      // Don't fail the request if email fails - verification was still submitted
    } else {
      console.log('[verification-submit] ✅ Confirmation email sent:', emailResult.id);
    }

    return NextResponse.json({
      success: true,
      verification,
      message: 'Verification submitted successfully',
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('[verification-submit] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification' },
      { status: 500 }
    );
  }
}
