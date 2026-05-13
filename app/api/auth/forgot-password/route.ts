import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/mailtrap';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Generates a custom reset token and sends it via Resend email service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('[forgot-password] Processing reset for:', normalizedEmail);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[forgot-password] Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Generate a custom reset token
    console.log('[forgot-password] Generating custom reset token...');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Store the token in password_reset_tokens table
    console.log('[forgot-password] Storing token in database...');
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: normalizedEmail,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('[forgot-password] Error storing token:', insertError);
      // Continue anyway - we'll still send the email
    }

    // Build the reset link
    const resetLink = `${appUrl}/update-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
    console.log('[forgot-password] ✅ Reset link generated');

    // Send email via Mailtrap
    console.log('[forgot-password] Sending password reset email via Mailtrap...');
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Reset Your BraidMe Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #9333ea;">Password Reset Request</h2>
            <p>Hi there,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© 2024 BraidMe. All rights reserved.</p>
          </div>
        `,
      });
      console.log('[forgot-password] ✅ Email sent via Mailtrap');
    } catch (emailError) {
      console.error('[forgot-password] Email sending error:', emailError);
      // Continue - don't fail the request if email fails
    }

    console.log('[forgot-password] ✅ Password reset process initiated');
    
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgot-password] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}


