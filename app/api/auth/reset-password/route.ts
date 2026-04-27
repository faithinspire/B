import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Reset password endpoint
 * Verifies the reset token and updates the user's password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, newPassword } = body;

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token, email, and new password are required' },
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

    console.log('Attempting password reset for email:', email);

    // Verify the reset token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token verification error:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check if token has expired
    const expiryTime = new Date(tokenData.expires_at).getTime();
    const currentTime = new Date().getTime();

    if (currentTime > expiryTime) {
      console.log('Reset token expired');
      return NextResponse.json(
        { success: false, error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (tokenData.used_at) {
      console.log('Reset token already used');
      return NextResponse.json(
        { success: false, error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    // Get the user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify user' },
        { status: 400 }
      );
    }

    const user = users?.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 400 }
      );
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 400 }
      );
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError);
      // Continue anyway - password was updated
    }

    console.log('Password reset successful for:', email);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
