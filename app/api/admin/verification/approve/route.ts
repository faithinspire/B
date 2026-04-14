import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
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

    // Update verification status
    const { data: verification, error: updateError } = await supabase
      .from('braider_verification')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      })
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update braider profile status
    await supabase
      .from('braider_profiles')
      .update({
        verification_status: 'approved',
        verified: true,
      })
      .eq('user_id', user_id);

    // Create notification for braider
    await supabase
      .from('verification_notifications')
      .insert({
        user_id,
        type: 'approved',
        title: 'Account Verified',
        message: 'Your account has been verified! You can now receive bookings.',
        is_read: false,
      });

    // Create audit log
    await supabase
      .from('verification_audit_log')
      .insert({
        user_id,
        action: 'approved',
        old_status: 'pending',
        new_status: 'approved',
        admin_id: session.user.id,
        reason: 'Admin approved verification',
      });

    return NextResponse.json({
      success: true,
      verification,
      message: 'Verification approved successfully',
    });
  } catch (error) {
    console.error('Verification approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve verification' },
      { status: 500 }
    );
  }
}
