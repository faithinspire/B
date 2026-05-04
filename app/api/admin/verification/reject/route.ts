import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, buildVerificationRejectedEmail } from '@/app/lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { braider_id, reason } = body;

    if (!braider_id) {
      return NextResponse.json({ success: false, error: 'braider_id required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Find the braider profile — try by id first, then user_id
    const { data: profileById } = await supabase
      .from('braider_profiles')
      .select('id, user_id, verification_status')
      .eq('id', braider_id)
      .maybeSingle();

    const { data: profileByUserId } = !profileById
      ? await supabase
          .from('braider_profiles')
          .select('id, user_id, verification_status')
          .eq('user_id', braider_id)
          .maybeSingle()
      : { data: null };

    const profile = profileById || profileByUserId;

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Braider profile not found',
      }, { status: 404 });
    }

    // Get braider's user info for email
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.user_id);
    const userEmail = user?.email;
    const userName = user?.user_metadata?.full_name || 'Braider';

    // Try updating with 'rejected' — if ENUM error, try 'unverified'
    const statusesToTry = ['rejected', 'unverified', 'denied'];
    let updated = false;
    let lastError = '';

    for (const status of statusesToTry) {
      const { error } = await supabase
        .from('braider_profiles')
        .update({ verification_status: status })
        .eq('id', profile.id);

      if (!error) {
        updated = true;
        console.log(`[verification-reject] Braider rejected with status: ${status}`);
        break;
      }
      lastError = error.message;
      console.log(`[verification-reject] Status "${status}" failed: ${error.message}`);
    }

    if (!updated) {
      return NextResponse.json({
        success: false,
        error: `Could not update verification status. Run the SQL migration. Last error: ${lastError}`,
      }, { status: 500 });
    }

    // Send rejection email via Resend
    if (userEmail) {
      console.log('[verification-reject] Sending rejection email to:', userEmail);
      const emailResult = await sendEmail({
        to: userEmail,
        subject: 'Verification Status Update - BraidMe',
        html: buildVerificationRejectedEmail(userName, reason),
      });

      if (!emailResult.success) {
        console.error('[verification-reject] ⚠️ Failed to send rejection email:', emailResult.error);
        // Don't fail the request if email fails - verification was still rejected
      } else {
        console.log('[verification-reject] ✅ Rejection email sent:', emailResult.id);
      }
    } else {
      console.warn('[verification-reject] ⚠️ User email not found for braider:', profile.user_id);
    }

    return NextResponse.json({ success: true, message: 'Braider rejected successfully' });
  } catch (error) {
    console.error('[verification-reject] ❌ Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
