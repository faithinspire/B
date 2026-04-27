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

    // Build reset link
    const resetLink = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@braidme.com',
          to: email,
          subject: 'Reset Your BraidMe Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">BraidMe</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #666; line-height: 1.6;">
                  We received a request to reset your password. Click the button below to create a new password.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  <strong>This link will expire in 24 hours.</strong>
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reset Password
                  </a>
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                  If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                </p>
                <p style="color: #999; font-size: 12px;">
                  Or copy and paste this link in your browser:<br/>
                  <code style="background: #f0f0f0; padding: 5px; border-radius: 3px;">${resetLink}</code>
                </p>
              </div>
            </div>
          `,
        });

        console.log('Password reset email sent successfully to:', email);
        console.log('Resend response:', result);

        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        });
      } catch (emailError) {
        console.error('Resend email error:', emailError);
        // Don't fail the request - token was created, just email failed
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        });
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping email');
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
