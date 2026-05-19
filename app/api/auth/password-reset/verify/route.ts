import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json();

    console.log('[Password Reset Verify] ✅ Request received for email:', email);

    if (!email || !token || !newPassword) {
      console.error('[Password Reset Verify] ❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, token, and newPassword' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      console.error('[Password Reset Verify] ❌ Password too short');
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      console.error('[Password Reset Verify] ❌ Password missing required character types');
      return NextResponse.json(
        { success: false, error: 'Password must contain uppercase, lowercase, and numbers' },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    console.log('[Password Reset Verify] 🔍 Looking up token for email:', email);

    // Find the reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, email, expires_at')
      .eq('token_hash', tokenHash)
      .eq('email', email.toLowerCase())
      .single();

    if (tokenError || !resetToken) {
      console.error('[Password Reset Verify] ❌ Token not found:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    console.log('[Password Reset Verify] ✅ Token found, checking expiration');

    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      console.log('[Password Reset Verify] ❌ Token expired');
      return NextResponse.json(
        { success: false, error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify email matches
    if (resetToken.email !== email.toLowerCase()) {
      console.log('[Password Reset Verify] ❌ Email mismatch');
      return NextResponse.json(
        { success: false, error: 'Invalid email or token mismatch' },
        { status: 400 }
      );
    }

    console.log('[Password Reset Verify] 🔍 Finding user by email:', email);

    // Get user by email from auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError || !users) {
      console.error('[Password Reset Verify] ❌ Auth list error:', authError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify user account' },
        { status: 500 }
      );
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.error('[Password Reset Verify] ❌ User not found in auth');
      return NextResponse.json(
        { success: false, error: 'User account not found' },
        { status: 400 }
      );
    }

    console.log('[Password Reset Verify] ✅ User found, updating password for user:', user.id);

    // Update user password in auth.users table
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[Password Reset Verify] ❌ Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('[Password Reset Verify] ✅ Password updated successfully, deleting token');

    // Delete the used token
    const { error: deleteError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('id', resetToken.id);

    if (deleteError) {
      console.error('[Password Reset Verify] ⚠️ Warning: Failed to delete token:', deleteError);
      // Don't fail the request if token deletion fails - password was already updated
    }

    console.log('[Password Reset Verify] ✅ Password reset completed successfully');

    return NextResponse.json(
      { success: true, message: 'Password reset successfully. You can now log in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Password Reset Verify] ❌ Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
