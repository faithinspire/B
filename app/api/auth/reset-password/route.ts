import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Password reset endpoint
 * Validates reset token and updates password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, newPassword } = body;

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token, email, and new password required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
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

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Step 1: Validate reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used_at')
      .eq('token', token)
      .eq('email', email)
      .single();

    if (tokenError || !resetToken) {
      console.error('Invalid reset token:', { token, email });
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 401 }
      );
    }

    // Step 2: Check if token is expired
    const expiresAt = new Date(resetToken.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Reset token has expired' },
        { status: 401 }
      );
    }

    // Step 3: Check if token was already used
    if (resetToken.used_at) {
      return NextResponse.json(
        { success: false, error: 'Reset token has already been used' },
        { status: 401 }
      );
    }

    const userId = resetToken.user_id;

    // Step 4: Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Step 5: Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError);
      // Don't fail - password was already updated
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
