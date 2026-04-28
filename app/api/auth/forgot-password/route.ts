import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Uses Supabase's native email service with token-based verification
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
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    });

    console.log('Initiating password reset for email:', email);

    // Check if user exists
    const { data: { users }, error: userError } = await createClient(
      supabaseUrl,
      serviceRoleKey || anonKey
    ).auth.admin.listUsers();

    const userExists = users?.some(u => u.email === email);

    if (!userExists) {
      // Return success anyway to not reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    const { error: tokenError } = await createClient(
      supabaseUrl,
      serviceRoleKey || anonKey
    ).from('password_reset_tokens').insert({
      email,
      token_hash: resetTokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (tokenError) {
      console.error('Token storage error:', tokenError);
      // Continue anyway - try to send email
    }

    const resetLink = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Use Supabase's native email service
    console.log('Sending password reset email via Supabase...');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetLink,
    });

    if (error) {
      console.error('Supabase password reset error:', error);
      // Still return success to not reveal if user exists
    }

    console.log('Password reset email sent to:', email);

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
