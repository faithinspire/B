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

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Determine the correct redirect URL from the request origin
    const origin = request.headers.get('origin') ||
      request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://braidmee.vercel.app';

    const resetUrl = `${origin}/auth/callback?next=/reset-password`;

    console.log('[forgot-password] Processing reset for:', normalizedEmail);
    console.log('[forgot-password] Reset URL:', resetUrl);
    console.log('[forgot-password] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);

    // PRIMARY: Use Resend for email delivery (ONLY method that works reliably)
    // NOTE: Supabase's built-in email only works for project team members, so we skip it
    const resendKey = process.env.RESEND_API_KEY;
    
    console.log('[forgot-password] Resend key check:', {
      exists: !!resendKey,
      length: resendKey?.length,
      startsWithRe: resendKey?.startsWith('re_'),
      isPlaceholder: resendKey?.includes('your_resend_api_key'),
      actualKey: resendKey?.substring(0, 50), // Log first 50 chars
    });
    
    if (!resendKey || resendKey.includes('your_resend_api_key')) {
      console.error('[forgot-password] ❌ RESEND_API_KEY not configured or is placeholder');
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    try {
      console.log('[forgot-password] Sending via Resend...');
      await sendResetEmailViaResend(normalizedEmail, resetUrl, resendKey);
      console.log('[forgot-password] ✅ Email sent successfully via Resend');
    } catch (resendErr) {
      console.error('[forgot-password] ❌ Resend failed:', resendErr);
      // Don't try Supabase - it won't work for regular users
      throw resendErr;
    }

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
 * Send reset email via Resend API
 * This is the ONLY reliable method for sending emails to regular users
 * (Supabase's built-in email only works for project team members)
 */
async function sendResetEmailViaResend(
  email: string,
  resetUrl: string,
  apiKey: string
): Promise<void> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@braidme.com';

    console.log('[forgot-password] Resend config:', {
      from: fromEmail,
      to: email,
      apiKeyLength: apiKey?.length,
    });

    // Validate inputs
    if (!apiKey || apiKey.length < 10) {
      throw new Error(`Invalid Resend API key: length=${apiKey?.length}`);
    }

    if (!email || !email.includes('@')) {
      throw new Error(`Invalid email address: ${email}`);
    }

    if (!fromEmail || !fromEmail.includes('@')) {
      throw new Error(`Invalid from email: ${fromEmail}`);
    }

    console.log('[forgot-password] Importing Resend SDK...');
    
    // Import Resend SDK
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    console.log('[forgot-password] Sending email via Resend...');
    
    // Send email using Resend SDK
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
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
    });

    console.log('[forgot-password] Resend response received:', {
      hasId: !!result.id || !!result.data?.id,
      hasError: !!result.error,
      fullResponse: JSON.stringify(result),
    });

    if (result.error) {
      console.error('[forgot-password] Resend API error:', result.error);
      throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    const emailId = result.id || result.data?.id;
    if (!emailId) {
      console.error('[forgot-password] Resend response missing ID:', JSON.stringify(result));
      throw new Error('Resend did not return an email ID');
    }

    console.log('[forgot-password] ✅ Resend email sent successfully:', {
      id: emailId,
      to: email,
    });
  } catch (err) {
    console.error('[forgot-password] ❌ Resend error:', {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
