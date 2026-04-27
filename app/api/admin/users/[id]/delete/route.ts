import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function deleteUserData(userId: string, serviceSupabase: any) {
  try {
    console.log(`=== DELETE USER: Starting deletion for user ${userId} ===`);

    // Step 1: Verify user exists before deletion
    const { data: profileCheck } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profileCheck) {
      console.log(`=== DELETE USER: User ${userId} not found in profiles ===`);
      return { success: false, message: 'User not found' };
    }

    // Step 2: Delete all related data in correct order (dependencies first)
    const deletionSteps = [
      {
        name: 'messages',
        query: () => serviceSupabase
          .from('messages')
          .delete()
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      },
      {
        name: 'conversations',
        query: () => serviceSupabase
          .from('conversations')
          .delete()
          .or(`customer_id.eq.${userId},braider_id.eq.${userId},admin_id.eq.${userId}`)
      },
      {
        name: 'bookings',
        query: () => serviceSupabase
          .from('bookings')
          .delete()
          .or(`customer_id.eq.${userId},braider_id.eq.${userId}`)
      },
      {
        name: 'payments',
        query: () => serviceSupabase
          .from('payments')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'notifications',
        query: () => serviceSupabase
          .from('notifications')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'braider_profiles',
        query: () => serviceSupabase
          .from('braider_profiles')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'braider_verification',
        query: () => serviceSupabase
          .from('braider_verification')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'profiles',
        query: () => serviceSupabase
          .from('profiles')
          .delete()
          .eq('id', userId)
      }
    ];

    // Execute all deletions
    for (const step of deletionSteps) {
      console.log(`=== DELETE USER: Deleting ${step.name} ===`);
      const { error } = await step.query();
      if (error) {
        console.error(`=== DELETE USER: Error deleting ${step.name} ===`, error);
        // Continue with other deletions even if one fails
      }
    }

    // Step 3: Delete auth user (this is the final step)
    console.log('=== DELETE USER: Deleting auth user ===');
    const { error: authError } = await serviceSupabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('=== DELETE USER: Auth delete error ===', authError);
      // Don't fail if auth user already deleted
    }

    // Step 4: Verify deletion - check if profile still exists
    const { data: verifyDelete } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (verifyDelete) {
      console.error(`=== DELETE USER: Profile still exists after deletion ===`);
      // Try one more time with a direct delete
      const { error: retryError } = await serviceSupabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (retryError) {
        throw new Error(`Failed to delete profile: ${retryError.message}`);
      }
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
    
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

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
