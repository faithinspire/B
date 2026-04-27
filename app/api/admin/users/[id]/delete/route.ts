import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function deleteUserData(userId: string, serviceSupabase: any) {
  try {
    // Delete in order of dependencies to avoid foreign key issues
    // IMPORTANT: Delete auth user FIRST to ensure it exists, then cascade delete related data
    
    // 0. Delete from auth FIRST (this is the source of truth)
    console.log('=== DELETE USER: Deleting auth user ===');
    const { error: authError } = await serviceSupabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('=== DELETE USER: Auth delete error ===', authError);
      // Don't throw - continue with data cleanup even if auth user not found
      console.log('=== DELETE USER: Auth user not found, continuing with data cleanup ===');
    }

    // 1. Delete messages
    console.log('=== DELETE USER: Deleting messages ===');
    const { error: msgError } = await serviceSupabase
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (msgError) console.error('Message delete error:', msgError);

    // 2. Delete conversations
    console.log('=== DELETE USER: Deleting conversations ===');
    const { error: convError } = await serviceSupabase
      .from('conversations')
      .delete()
      .or(`customer_id.eq.${userId},braider_id.eq.${userId},admin_id.eq.${userId}`);
    if (convError) console.error('Conversation delete error:', convError);

    // 3. Delete bookings
    console.log('=== DELETE USER: Deleting bookings ===');
    const { error: bookError } = await serviceSupabase
      .from('bookings')
      .delete()
      .or(`customer_id.eq.${userId},braider_id.eq.${userId}`);
    if (bookError) console.error('Booking delete error:', bookError);

    // 4. Delete payments
    console.log('=== DELETE USER: Deleting payments ===');
    const { error: payError } = await serviceSupabase
      .from('payments')
      .delete()
      .eq('user_id', userId);
    if (payError) console.error('Payment delete error:', payError);

    // 5. Delete notifications
    console.log('=== DELETE USER: Deleting notifications ===');
    const { error: notifError } = await serviceSupabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (notifError) console.error('Notification delete error:', notifError);

    // 6. Delete braider profile if exists
    console.log('=== DELETE USER: Deleting braider profile ===');
    const { error: braiderProfError } = await serviceSupabase
      .from('braider_profiles')
      .delete()
      .eq('user_id', userId);
    if (braiderProfError) console.error('Braider profile delete error:', braiderProfError);

    // 7. Delete braider verification if exists
    console.log('=== DELETE USER: Deleting braider verification ===');
    const { error: verifyError } = await serviceSupabase
      .from('braider_verification')
      .delete()
      .eq('user_id', userId);
    if (verifyError) console.error('Verification delete error:', verifyError);

    // 8. Delete profile
    console.log('=== DELETE USER: Deleting profile ===');
    const { error: profError } = await serviceSupabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profError) console.error('Profile delete error:', profError);

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
