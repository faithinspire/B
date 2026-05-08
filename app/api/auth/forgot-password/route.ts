import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint using Brevo (Sendinblue) for email delivery.
 * 
 * This uses Brevo's SMTP API which:
 * - Works for ALL users (no restrictions)
 * - Reliable email delivery
 * - Professional email service
 * - Sends to any registered email address
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

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Determine the correct redirect URL
    const origin = request.headers.get('origin') ||
      request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://braidmee.vercel.app';

    const resetUrl = `${origin}/auth/callback?next=/reset-password`;

    console.log('[forgot-password] Processing reset for:', normalizedEmail);
    console.log('[forgot-password] Reset URL:', resetUrl);

    // Send email via Brevo
    const result = await sendPasswordResetEmailViaBrevo(
      normalizedEmail,
      resetUrl
    );

    if (!result.success) {
      console.error('[forgot-password] Brevo error:', result.error);
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    console.log('[forgot-password] ✅ Password reset email sent successfully via Brevo');

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgot-password] Fatal error:', error);
    // Still return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }
}

/**
 * Send password reset email via Brevo SMTP API
 * Works for ALL users - no restrictions
 */
async function sendPasswordResetEmailViaBrevo(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@braidme.com';
    const fromName = process.env.BREVO_FROM_NAME || 'BraidMe';

    console.log('[forgot-password] Brevo config:', {
      from: fromEmail,
      fromName: fromName,
      to: email,
      apiKeyLength: apiKey?.length,
    });

    // Validate inputs
    if (!apiKey || apiKey.length < 10) {
      throw new Error(`Invalid Brevo API key: length=${apiKey?.length}`);
    }

    if (!email || !email.includes('@')) {
      throw new Error(`Invalid email address: ${email}`);
    }

    if (!fromEmail || !fromEmail.includes('@')) {
      throw new Error(`Invalid from email: ${fromEmail}`);
    }

    console.log('[forgot-password] Sending password reset email via Brevo...');

    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [
          {
            email: email,
            name: email.split('@')[0], // Use part before @ as name
          },
        ],
        subject: 'Reset your BraidMe password',
        htmlContent: buildPasswordResetEmail(resetUrl),
        replyTo: {
          email: fromEmail,
          name: fromName,
        },
      }),
    });

    const responseData = await response.json();

    console.log('[forgot-password] Brevo response:', {
      status: response.status,
      messageId: responseData.messageId,
      hasError: !response.ok,
    });

    if (!response.ok) {
      console.error('[forgot-password] Brevo API error:', responseData);
      return {
        success: false,
        error: `Brevo error: ${responseData.message || JSON.stringify(responseData)}`,
      };
    }

    if (!responseData.messageId) {
      console.error('[forgot-password] Brevo response missing messageId:', responseData);
      return {
        success: false,
        error: 'Brevo did not return a message ID',
      };
    }

    console.log('[forgot-password] ✅ Brevo email sent successfully:', {
      messageId: responseData.messageId,
      to: email,
    });

    return { success: true };
  } catch (err) {
    console.error('[forgot-password] ❌ Brevo error:', {
      message: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Build the password reset email HTML
 */
function buildPasswordResetEmail(resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✂️ BraidMe</h1>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 16px;">Reset Your Password</h2>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        We received a request to reset your password. Click the button below to create a new password.
        This link expires in 1 hour.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" 
           style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
        If you didn't request this, you can safely ignore this email. Your password won't change.
      </p>
      
      <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
        Or copy this link: <a href="${resetUrl}" style="color: #9333ea;">${resetUrl}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © 2026 BraidMe. All rights reserved.
      </p>
    </div>
  `;
}
