import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Uses Supabase's native resetPasswordForEmail — sends a real email with a
 * magic link. The redirectTo points to /auth/callback which handles the
 * Supabase token exchange, then redirects to /reset-password for the user
 * to enter their new password.
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://braidmee.vercel.app';

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    });

    // Supabase sends the email. The link in the email will redirect to
    // /auth/callback?next=/reset-password so the user lands on the
    // password-entry form after Supabase validates the token.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error('Supabase resetPasswordForEmail error:', error.message);
      // Don't expose the real error — always return success to avoid
      // leaking whether an email address is registered.
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
