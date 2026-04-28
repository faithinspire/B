import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Reset password endpoint
 * POST /api/auth/reset-password
 * Body: { token: string, email: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Token, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Hash the token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Verify token exists and is not expired
    const { data: tokenRecord, error: queryError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('email', email)
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (queryError || !tokenRecord) {
      console.error('Token verification failed:', queryError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Get the user from auth
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Delete the used token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('id', tokenRecord.id);

    // Clean up expired tokens
    await supabase
      .from('password_reset_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    console.log('Password reset successful for:', email);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
