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

    console.log('[Password Reset Verify] Request received for email:', email);

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain uppercase, lowercase, and numbers' },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    console.log('[Password Reset Verify] Looking up token for email:', email);

    // Find the reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, email, expires_at')
      .eq('token_hash', tokenHash)
      .eq('email', email.toLowerCase())
      .single();

    if (tokenError || !resetToken) {
      console.error('[Password Reset Verify] Token not found:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    console.log('[Password Reset Verify] Token found, checking expiration');

    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      console.log('[Password Reset Verify] Token expired');
      return NextResponse.json(
        { success: false, error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Verify email matches
    if (resetToken.email !== email.toLowerCase()) {
      console.log('[Password Reset Verify] Email mismatch');
      return NextResponse.json(
        { success: false, error: 'Invalid email or token mismatch' },
        { status: 400 }
      );
    }

    console.log('[Password Reset Verify] Finding user by email:', email);

    // Get user by email from auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError || !users) {
      console.error('[Password Reset Verify] Auth list error:', authError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 400 }
      );
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.error('[Password Reset Verify] User not found in auth');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 400 }
      );
    }

    console.log('[Password Reset Verify] Updating password for user:', user.id);

    // Update user password in auth.users table
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[Password Reset Verify] Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('[Password Reset Verify] Password updated successfully, deleting token');

    // Delete the used token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('id', resetToken.id);

    console.log('[Password Reset Verify] Password reset completed successfully');

    return NextResponse.json(
      { success: true, message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Password Reset Verify] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
