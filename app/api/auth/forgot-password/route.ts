import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Uses Supabase's built-in recovery link generation
 * The recovery link is sent via Resend email service
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
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[forgot-password] Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    if (!resendApiKey) {
      console.error('[forgot-password] Missing Resend API key');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(resendApiKey);

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const userExists = users?.some(u => u.email?.toLowerCase() === normalizedEmail);

    if (listError) {
      console.error('[forgot-password] Error checking user:', listError);
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    if (!userExists) {
      // For security, don't reveal if user exists
      console.log('[forgot-password] User not found:', normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate a recovery link using Supabase
    console.log('[forgot-password] Generating recovery link via Supabase...');
    
    const { data, error: generateError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
    });

    if (generateError) {
      console.error('[forgot-password] Supabase generateLink error:', generateError);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    if (!data?.properties?.recovery_link) {
      console.error('[forgot-password] No recovery link generated');
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const recoveryLink = data.properties.recovery_link;
    console.log('[forgot-password] ✅ Recovery link generated');

    // Send email via Resend
    console.log('[forgot-password] Sending password reset email via Resend...');
    const emailResult = await resend.emails.send({
      from: 'noreply@braidme.com',
      to: normalizedEmail,
      subject: 'Reset Your BraidMe Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9333ea;">Password Reset Request</h2>
          <p>Hi there,</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryLink}" style="background-color: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${recoveryLink}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2024 BraidMe. All rights reserved.</p>
        </div>
      `,
    });

    if (emailResult.error) {
      console.error('[forgot-password] Resend email error:', emailResult.error);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    console.log('[forgot-password] ✅ Email sent via Resend:', emailResult.data?.id);

    // Store the token in password_reset_tokens table for verification
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: normalizedEmail,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('[forgot-password] Error storing token:', insertError);
      // Continue anyway - the recovery link still works
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


