import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { braider_id, user_id, reason } = body;

    // Accept either braider_id or user_id
    const targetId = braider_id || user_id;

    if (!targetId || !reason) {
      return NextResponse.json(
        { error: 'braider_id (or user_id) and reason are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Create notification for braider
    await supabase
      .from('verification_notifications')
      .insert({
        user_id: actualUserId,
        type: 'rejected',
        title: 'Verification Rejected',
        message: `Your verification was not approved. Reason: ${reason}`,
        is_read: false,
      });

    // Create audit log
    await supabase
      .from('verification_audit_log')
      .insert({
        user_id: actualUserId,
        action: 'rejected',
        old_status: 'pending',
        new_status: 'rejected',
        admin_id: session.user.id,
        reason: `Admin rejected verification: ${reason}`,
      });

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
