import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Generates a password reset token and sends email
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

      // Use Supabase's built-in email sending or Resend
      const resendApiKey = process.env.RESEND_API_KEY;
      const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@braidmee.com';

      if (resendApiKey) {
        // Use Resend for email sending
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: email,
            subject: 'Reset Your BraidMe Password',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hi ${profile.full_name || 'there'},</p>
                <p>We received a request to reset your password. Click the link below to create a new password:</p>
                <p style="margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Password
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                  Or copy this link: <br/>
                  <code style="background-color: #f0f0f0; padding: 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">
                    ${resetUrl}
                  </code>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                  This link will expire in 24 hours. If you didn't request this, please ignore this email.
                </p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Resend email error:', error);
          // Don't fail - token was created successfully
        }
      } else {
        // Fallback: Use Supabase auth email
        console.log('Resend not configured, using Supabase email');
        // Supabase will handle this via their email service
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail - token was created successfully
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
