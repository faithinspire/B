import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint.
 *
 * IMPORTANT: Supabase's built-in email only sends to project team members.
 * For production, you MUST configure custom SMTP in Supabase dashboard:
 * https://supabase.com/dashboard/project/[ref]/settings/auth
 *
 * This endpoint calls Supabase's resetPasswordForEmail which uses whatever
 * SMTP is configured (built-in or custom).
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    // Determine the correct redirect URL from the request origin
    const origin = request.headers.get('origin') ||
      request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://braidmee.vercel.app';

    const redirectTo = `${origin}/auth/callback?next=/reset-password`;

    console.log('[forgot-password] email:', email, '| redirectTo:', redirectTo);

    // Use anon client — resetPasswordForEmail requires anon key
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    });

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    if (error) {
      console.error('[forgot-password] Supabase error:', error.message);
      // If Supabase SMTP isn't configured, try Resend as fallback
      if (
        error.message.includes('not authorized') ||
        error.message.includes('rate limit') ||
        error.message.includes('smtp')
      ) {
        // Try Resend fallback if API key is configured
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey && resendKey !== 're_your_resend_api_key_here') {
          await sendResetEmailViaResend(email, redirectTo, resendKey);
        }
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }
}

/**
 * Fallback: Send reset email via Resend API directly
 * Used when Supabase SMTP isn't configured
 */
async function sendResetEmailViaResend(
  email: string,
  resetUrl: string,
  apiKey: string
): Promise<void> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@braidmee.com';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `BraidMe <${fromEmail}>`,
        to: [email],
        subject: 'Reset your BraidMe password',
        html: `
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
        `,
      }),
    });
    console.log('[forgot-password] Resend fallback email sent to:', email);
  } catch (err) {
    console.error('[forgot-password] Resend fallback failed:', err);
  }
}
