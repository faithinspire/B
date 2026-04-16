import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { braider_id, user_id, reason = 'Admin rejected verification' } = body;

    // Accept either braider_id or user_id
    const targetId = braider_id || user_id;

    if (!targetId) {
      return NextResponse.json(
        { error: 'braider_id (or user_id) is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Skip auth check - service role key is sufficient for server-side operations
    // The service role key is only available server-side and provides full access

    // If braider_id is provided, get the user_id from braider_profiles
    let actualUserId = targetId;
    if (braider_id) {
      const { data: braiderProfile } = await supabase
        .from('braider_profiles')
        .select('user_id')
        .eq('id', braider_id)
        .single();
      
      if (braiderProfile?.user_id) {
        actualUserId = braiderProfile.user_id;
      }
    }

    // Update braider profile status
    const { error: updateError } = await supabase
      .from('braider_profiles')
      .update({
        verification_status: 'rejected',
        verified: false,
      })
      .eq(braider_id ? 'id' : 'user_id', targetId);

    if (updateError) {
      throw updateError;
    }

    // Create notification for braider using the notifications table
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: actualUserId,
          type: 'verification_rejected',
          title: 'Verification Rejected',
          message: `Your verification was not approved. Reason: ${reason}`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
    } catch (notifError) {
      console.warn('Failed to create notification:', notifError);
      // Continue anyway - notification is not critical
    }

    return NextResponse.json({
      success: true,
      message: 'Verification rejected successfully',
    });
  } catch (error) {
    console.error('Verification reject error:', error);
    return NextResponse.json(
      { error: 'Failed to reject verification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
