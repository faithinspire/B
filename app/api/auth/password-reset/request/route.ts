import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    console.log('[Password Reset] 📧 Request for:', normalizedEmail);

    // Get Brevo configuration with fallbacks
    const brevoApiKey = process.env.BREVO_API_KEY || '';
    const brevoFromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@braidme.com';
    const brevoFromName = process.env.BREVO_FROM_NAME || 'BraidMe';

    console.log('[Password Reset] 🔍 Brevo Config:', {
      hasApiKey: !!brevoApiKey,
      fromEmail: brevoFromEmail,
      fromName: brevoFromName,
    });

    // Check if user exists
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('[Password Reset] ❌ Auth error:', authError);
      // Don't reveal if account exists for security
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, you will receive a password reset link.' },
        { status: 200 }
      );
    }

    const userExists = users?.some(u => u.email?.toLowerCase() === normalizedEmail);

    if (!userExists) {
      console.log('[Password Reset] ℹ️ User not found:', normalizedEmail);
      // Don't reveal if account exists for security
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, you will receive a password reset link.' },
        { status: 200 }
      );
    }

    console.log('[Password Reset] ✅ User found, generating token');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: normalizedEmail,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('[Password Reset] ❌ Token storage error:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate reset token' },
        { status: 500 }
      );
    }

    console.log('[Password Reset] ✅ Token stored, sending email');

    // Build reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/update-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send email via Brevo
    try {
      // If no API key, still generate token but skip email sending
      if (!brevoApiKey) {
        console.warn('[Password Reset] ⚠️ No Brevo API key, skipping email send');
        return NextResponse.json(
          { success: true, message: 'Password reset link generated. Email service temporarily unavailable.' },
          { status: 200 }
        );
      }

      console.log('[Password Reset] 📤 Sending email via Brevo:', {
        to: normalizedEmail,
        from: `${brevoFromName} <${brevoFromEmail}>`,
      });

      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: brevoFromName,
            email: brevoFromEmail,
          },
          to: [{ email: normalizedEmail }],
          subject: 'Reset Your BraidMe Password',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password. Click the link below to create a new password:
              </p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #8B5A3C; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
                Reset Password
              </a>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                Or copy and paste this link in your browser:
              </p>
              <p style="color: #999; font-size: 12px; word-break: break-all; margin: 10px 0;">
                ${resetLink}
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </p>
            </div>
          `,
        }),
      });

      console.log('[Password Reset] 📨 Brevo Response:', {
        status: brevoResponse.status,
        statusText: brevoResponse.statusText,
      });

      if (!brevoResponse.ok) {
        const errorText = await brevoResponse.text();
        console.error('[Password Reset] ❌ Brevo API Error:', {
          status: brevoResponse.status,
          statusText: brevoResponse.statusText,
          error: errorText,
        });
        // Still return success since token was created
        return NextResponse.json(
          { success: true, message: 'Password reset link generated. Email delivery may be delayed.' },
          { status: 200 }
        );
      }

      console.log('[Password Reset] ✅ Email sent successfully');
      return NextResponse.json(
        { success: true, message: 'Password reset link sent to your email' },
        { status: 200 }
      );
    } catch (emailError) {
      console.error('[Password Reset] ❌ Email send error:', emailError);
      // Still return success since token was created
      return NextResponse.json(
        { success: true, message: 'Password reset link generated. Please check your email.' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('[Password Reset] ❌ Request error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
