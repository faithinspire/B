import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { braider_id } = await request.json();

    if (!braider_id) {
      return NextResponse.json(
        { error: 'Missing braider_id' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Update braider status
    const { error: updateError } = await db
      .from('profiles')
      .update({ verification_status: 'verified' })
      .eq('id', braider_id);

    if (updateError) throw updateError;

    // Get braider details for notification
    const { data: braider } = await db
      .from('profiles')
      .select('id, full_name')
      .eq('id', braider_id)
      .single();

    // Send notification to braider
    if (braider?.id) {
      await db.from('notifications').insert({
        user_id: braider.id,
        type: 'verification_approved',
        title: 'Verification Approved',
        message: 'Your braider profile has been verified successfully!',
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Braider approved successfully',
    });
  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to approve braider' },
      { status: 500 }
    );
  }
}
