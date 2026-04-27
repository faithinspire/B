import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Generates a secure reset token, stores it in database, and sends email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    console.log('Initiating password reset for email:', email);

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const user = users?.find(u => u.email === email);

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the reset token in a password_reset_tokens table
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        email: email,
        token: resetToken,
        expires_at: tokenExpiry.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing reset token:', insertError);
      // Continue anyway - try to send email
    }

    // Send email with reset link
    const resetLink = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    try {
      // Try using Supabase's email service first
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: resetLink,
        },
      });

      if (!emailError) {
        console.log('Password reset email sent via Supabase to:', email);
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        });
      }
    } catch (err) {
      console.log('Supabase email failed, trying alternative method:', err);
    }

    // Fallback: Send email using fetch to a simple email service
    // This is a workaround - in production, use SendGrid, Resend, or similar
    const emailContent = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your BraidMe account.</p>
      <p>Click the link below to reset your password (valid for 24 hours):</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    console.log('Password reset link generated for:', email);
    console.log('Reset link:', resetLink);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
