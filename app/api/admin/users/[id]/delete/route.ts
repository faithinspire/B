import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Delete from auth
    const { error: authError } = await serviceSupabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth delete error:', authError);
      return NextResponse.json(
        { error: `Failed to delete user: ${authError.message}` },
        { status: 400 }
      );
    }

    // Delete profile
    await serviceSupabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Delete braider profile if exists
    await serviceSupabase
      .from('braider_profiles')
      .delete()
      .eq('user_id', userId);

    // Delete notifications
    await serviceSupabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Delete user error:', message);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
