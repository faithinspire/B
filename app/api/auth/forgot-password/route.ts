import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Generates a password reset token and sends email via Supabase
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

    // Step 1: Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      // Don't reveal if email exists or not (security best practice)
      console.log('Email not found:', email);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const userId = profile.id;

    // Step 2: Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Step 3: Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Failed to create reset token' },
        { status: 500 }
      );
    }

    // Step 4: Send reset email via Supabase
    try {
      const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px;">Hi ${profile.full_name || 'there'},</p>
            <p style="color: #666; font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="background-color: #fff; padding: 12px; border-radius: 4px; border: 1px solid #ddd; word-break: break-all; font-size: 12px; color: #333;">
              ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              <strong>Security Note:</strong> This link will expire in 24 hours. If you didn't request this password reset, please ignore this email. Your account is safe.
            </p>
          </div>
        </div>
      `;

      console.log('Sending password reset email via Supabase to:', email);

      // Use Supabase's email service
      const { error: emailError } = await supabase.auth.admin.sendRawEmail({
        to: email,
        subject: 'Reset Your BraidMe Password',
        html: emailHtml,
      });

      if (emailError) {
        console.error('Supabase email error:', emailError);
        // Don't fail - token was created successfully
        // User can still use the token if they retrieve it another way
      } else {
        console.log('Email sent successfully via Supabase to:', email);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Log but don't fail - token was created successfully
    }

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
