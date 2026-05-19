import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/brevo';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Generates a custom reset token and sends it via Brevo email service
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

    // Send email via Brevo
    console.log('[forgot-password] Sending password reset email via Brevo...');
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Reset Your BraidMe Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #9333ea; margin-top: 0; margin-bottom: 20px; font-size: 24px;">Password Reset Request</h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Hi there,</p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetLink}" style="background-color: #9333ea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; border: 2px solid #9333ea;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-bottom: 10px; font-weight: bold;">Or copy and paste this link in your browser:</p>
              <p style="color: #0066cc; font-size: 13px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px; border-left: 4px solid #9333ea;">
                <a href="${resetLink}" style="color: #0066cc; text-decoration: underline;">${resetLink}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; margin-bottom: 10px;">
                <strong>Security Note:</strong> This link will expire in 24 hours. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </p>
              
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                © 2026 BraidMe. All rights reserved.<br>
                <a href="${appUrl}" style="color: #9333ea; text-decoration: none;">Visit BraidMe</a>
              </p>
            </div>
          </div>
        `,
        text: `Password Reset Request\n\nHi there,\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetLink}\n\nThis link will expire in 24 hours. If you didn't request this, please ignore this email.\n\n© 2026 BraidMe. All rights reserved.`,
      });
      console.log('[forgot-password] ✅ Email sent via Brevo');
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


