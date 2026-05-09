import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint using MailerSend API
 * Sends password reset emails via MailerSend
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[forgot-password] JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

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

    const resetUrl = `${origin}/update-password`;

    console.log('[forgot-password] Processing reset for:', normalizedEmail);
    console.log('[forgot-password] Reset URL:', resetUrl);

    // Send password reset email via MailerSend
    console.log('[forgot-password] 📧 Sending password reset via MailerSend...');
    const mailersendResult = await sendPasswordResetEmailViaMailerSend(
      normalizedEmail,
      resetUrl
    );

    if (!mailersendResult.success) {
      console.error('[forgot-password] ❌ MailerSend error:', mailersendResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: mailersendResult.error || 'Failed to send password reset email'
        },
        { status: 500 }
      );
    }

    console.log('[forgot-password] ✅ Password reset email sent successfully via MailerSend');
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgot-password] Fatal error:', error);
    console.error('[forgot-password] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Send password reset email via MailerSend API
 */
async function sendPasswordResetEmailViaMailerSend(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiToken = process.env.MAILERSEND_API_TOKEN;
    const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'noreply@braidme.com';
    const fromName = process.env.MAILERSEND_FROM_NAME || 'BraidMe';

    console.log('[forgot-password] MailerSend config check:', {
      hasApiToken: !!apiToken,
      apiTokenLength: apiToken?.length,
      apiTokenPrefix: apiToken?.substring(0, 10),
      fromEmail: fromEmail,
      fromName: fromName,
      toEmail: email,
    });

    // Validate API token
    if (!apiToken || apiToken.length < 10) {
      const error = `Invalid MailerSend API token: length=${apiToken?.length || 0}`;
      console.error('[forgot-password] ❌', error);
      throw new Error(error);
    }

    // Validate email
    if (!email || !email.includes('@')) {
      const error = `Invalid recipient email: ${email}`;
      console.error('[forgot-password] ❌', error);
      throw new Error(error);
    }

    // Validate from email
    if (!fromEmail || !fromEmail.includes('@')) {
      const error = `Invalid from email: ${fromEmail}`;
      console.error('[forgot-password] ❌', error);
      throw new Error(error);
    }

    console.log('[forgot-password] 📤 Sending password reset email via MailerSend...');

    // Send email via MailerSend API
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: [
          {
            email: email,
            name: email.split('@')[0],
          },
        ],
        subject: 'Reset your BraidMe password',
        html: buildPasswordResetEmail(resetUrl),
        reply_to: {
          email: fromEmail,
          name: fromName,
        },
      }),
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error('[forgot-password] ❌ Failed to parse MailerSend response as JSON:', jsonError);
      const text = await response.text();
      console.error('[forgot-password] Response text:', text);
      return {
        success: false,
        error: `MailerSend API error (${response.status}): Invalid response format`,
      };
    }

    console.log('[forgot-password] MailerSend API response:', {
      status: response.status,
      statusText: response.statusText,
      messageId: responseData.message_id,
      message: responseData.message,
    });

    if (!response.ok) {
      console.error('[forgot-password] ❌ MailerSend API error (HTTP ' + response.status + '):', responseData);
      
      // Log specific error codes for debugging
      if (response.status === 401) {
        console.error('[forgot-password] 🔴 AUTHENTICATION ERROR: API token is invalid, expired, or revoked');
        console.error('[forgot-password] Action: Verify MailerSend API token in .env.local');
      } else if (response.status === 400) {
        console.error('[forgot-password] 🔴 BAD REQUEST: Check email format or sender configuration');
        console.error('[forgot-password] Details:', responseData);
      } else if (response.status === 429) {
        console.error('[forgot-password] 🔴 RATE LIMIT: Too many emails sent');
      }
      
      return {
        success: false,
        error: `MailerSend error (${response.status}): ${responseData.message || JSON.stringify(responseData)}`,
      };
    }

    if (!responseData.message_id) {
      console.error('[forgot-password] ❌ MailerSend response missing message_id:', responseData);
      return {
        success: false,
        error: 'MailerSend did not return a message ID',
      };
    }

    console.log('[forgot-password] ✅ MailerSend email sent successfully:', {
      messageId: responseData.message_id,
      to: email,
    });

    return { success: true };
  } catch (err) {
    console.error('[forgot-password] ❌ MailerSend error:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
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
