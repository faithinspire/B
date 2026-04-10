import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { approved } = await request.json();
    const braider_id = params.id;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Update braider verification status
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        verification_status: approved ? 'verified' : 'rejected',
        verified_at: new Date().toISOString(),
      })
      .eq('id', braider_id);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    // Create notification for braider
    const status_text = approved ? 'approved' : 'rejected';
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: braider_id,
        type: 'verification_' + status_text,
        title: `Your verification has been ${status_text}`,
        message: approved
          ? 'Congratulations! Your profile has been verified and is now live.'
          : 'Your verification was not approved. Please review your documents and try again.',
        read: false,
      });

    if (notifError) {
      console.warn('Warning: Could not create notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      message: `Braider ${status_text} successfully`,
    });
  } catch (err) {
    console.error('Verification API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
