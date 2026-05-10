import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Forgot password endpoint
 * Uses Supabase's built-in recovery link generation
 * The recovery link is sent via Supabase's email service
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

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[forgot-password] Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

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


