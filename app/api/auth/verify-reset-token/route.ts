import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Verify password reset token
 * POST /api/auth/verify-reset-token
 * Body: { token: string, email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: 'Token and email are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { valid: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Hash the token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists and is not expired
    const { data: tokenRecord, error: queryError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('email', email)
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (queryError || !tokenRecord) {
      console.error('Token verification failed:', queryError);
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired token',
      });
    }

    return NextResponse.json({
      valid: true,
      email: tokenRecord.email,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
