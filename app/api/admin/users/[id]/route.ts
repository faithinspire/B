import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Delete user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) return NextResponse.json({ error: deleteError.message || 'Failed to delete user' }, { status: 500 });

    // Delete related data
    await Promise.allSettled([
      supabaseAdmin.from('profiles').delete().eq('id', userId),
      supabaseAdmin.from('braider_profiles').delete().eq('user_id', userId),
      supabaseAdmin.from('bookings').delete().eq('customer_id', userId),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Update profile status
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
