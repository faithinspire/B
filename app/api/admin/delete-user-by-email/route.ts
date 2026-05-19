import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Get user ID by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      console.error('[delete-user] Error listing users:', getUserError);
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
    }

    const userToDelete = users?.find(u => u.email === email);

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`[delete-user] Deleting user: ${email} (ID: ${userToDelete.id})`);

    // Delete from profiles table
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userToDelete.id);

    // Delete from braider_profiles table
    await supabase
      .from('braider_profiles')
      .delete()
      .eq('user_id', userToDelete.id);

    // Delete from auth.users using admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);

    if (deleteError) {
      console.error('[delete-user] Error deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    console.log(`[delete-user] ✅ User deleted successfully: ${email}`);

    return NextResponse.json({
      success: true,
      message: `User ${email} has been deleted`,
      userId: userToDelete.id,
    });
  } catch (error) {
    console.error('[delete-user] ❌ Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
