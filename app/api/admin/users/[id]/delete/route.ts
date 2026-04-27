import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function deleteUserData(userId: string, serviceSupabase: any) {
  try {
    // Delete in order of dependencies to avoid foreign key issues
    
    // 1. Delete messages
    console.log('=== DELETE USER: Deleting messages ===');
    await serviceSupabase
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    // 2. Delete conversations
    console.log('=== DELETE USER: Deleting conversations ===');
    await serviceSupabase
      .from('conversations')
      .delete()
      .or(`customer_id.eq.${userId},braider_id.eq.${userId},admin_id.eq.${userId}`);

    // 3. Delete bookings
    console.log('=== DELETE USER: Deleting bookings ===');
    await serviceSupabase
      .from('bookings')
      .delete()
      .or(`customer_id.eq.${userId},braider_id.eq.${userId}`);

    // 4. Delete payments
    console.log('=== DELETE USER: Deleting payments ===');
    await serviceSupabase
      .from('payments')
      .delete()
      .eq('user_id', userId);

    // 5. Delete notifications
    console.log('=== DELETE USER: Deleting notifications ===');
    await serviceSupabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    // 6. Delete braider profile if exists
    console.log('=== DELETE USER: Deleting braider profile ===');
    await serviceSupabase
      .from('braider_profiles')
      .delete()
      .eq('user_id', userId);

    // 7. Delete braider verification if exists
    console.log('=== DELETE USER: Deleting braider verification ===');
    await serviceSupabase
      .from('braider_verification')
      .delete()
      .eq('user_id', userId);

    // 8. Delete profile
    console.log('=== DELETE USER: Deleting profile ===');
    await serviceSupabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 9. Delete from auth (this cascades to delete auth.users)
    console.log('=== DELETE USER: Deleting auth user ===');
    const { error: authError } = await serviceSupabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('=== DELETE USER: Auth delete error ===', authError);
      throw new Error(`Failed to delete user: ${authError.message}`);
    }

    console.log(`=== DELETE USER: Successfully deleted user ${userId} ===`);
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('=== DELETE USER: Error ===', message);
    throw error;
  }
}

export async function POST(
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

    console.log(`=== DELETE USER: Starting deletion for user ${userId} ===`);

    // Use service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const result = await deleteUserData(userId, serviceSupabase);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('=== DELETE USER: Error ===', message);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return POST(request, { params });
}
