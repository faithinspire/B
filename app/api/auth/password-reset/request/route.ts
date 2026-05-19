import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendSMS, isTwilioConfigured, formatPhoneNumber } from '@/lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, phone, method = 'email' } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    // Validate method
    if (!['email', 'sms'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Invalid method. Use "email" or "sms"' },
        { status: 400 }
      );
    }

    // Check if SMS is requested but Twilio is not configured
    if (method === 'sms' && !isTwilioConfigured()) {
      return NextResponse.json(
        { success: false, error: 'SMS service is not available. Please use email instead.' },
        { status: 400 }
      );
    }

    const contactInfo = method === 'email' ? email : phone;
    console.log(`[Password Reset] Request received for ${method}:`, contactInfo);

    // Check if user exists in auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('[Password Reset] Auth list error:', authError);
      return NextResponse.json(
        { success: true, message: `If an account exists with this ${method}, you will receive a password reset link.` },
        { status: 200 }
      );
    }

    const userExists = users?.some(u => 
      method === 'email' 
        ? u.email?.toLowerCase() === email?.toLowerCase()
        : u.phone === phone
    );

    if (!userExists) {
      console.log(`[Password Reset] User not found for ${method}:`, contactInfo);
      // Don't reveal if account exists for security
      return NextResponse.json(
        { success: true, message: `If an account exists with this ${method}, you will receive a password reset link.` },
        { status: 200 }
      );
    }

    console.log(`[Password Reset] User found, generating token for ${method}:`, contactInfo);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    console.log('[Password Reset] Token generated, storing in database');

    // Store token in database
    const { error: tokenError, data: insertedData } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: method === 'email' ? email?.toLowerCase() : null,
        phone: method === 'sms' ? phone : null,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })
      .select();

    if (tokenError) {
      console.error('[Password Reset] Token storage error:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate reset token: ' + tokenError.message },
        { status: 500 }
      );
    }

    console.log('[Password Reset] Token stored successfully:', insertedData);

    // Send reset link via email or SMS
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&${method === 'email' ? 'email' : 'phone'}=${encodeURIComponent(contactInfo)}`;

    console.log(`[Password Reset] Sending ${method} to:`, contactInfo);
    console.log('[Password Reset] Reset link:', resetLink);

    if (method === 'email') {
      // Send via Brevo email
      try {
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: 'BraidMe',
              email: process.env.BREVO_FROM_EMAIL || 'noreply@braidme.com',
            },
            to: [
              {
                email: email,
              },
            ],
            subject: 'Reset Your BraidMe Password',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>We received a request to reset your password. Click the link below to create a new password:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #8B5A3C; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                  Reset Password
                </a>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
                <p style="color: #666; font-size: 12px; word-break: break-all;">${resetLink}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
              </div>
            `,
          }),
        });

        const responseText = await brevoResponse.text();
        console.log('[Password Reset] Brevo response status:', brevoResponse.status);
        console.log('[Password Reset] Brevo response:', responseText);

        if (!brevoResponse.ok) {
          console.error('[Password Reset] Brevo email send failed:', responseText);
          return NextResponse.json(
            { success: false, error: 'Failed to send reset email. Status: ' + brevoResponse.status },
            { status: 500 }
          );
        }

        console.log('[Password Reset] Email sent successfully to:', email);
      } catch (emailError) {
        console.error('[Password Reset] Email send error:', emailError);
        return NextResponse.json(
          { success: false, error: 'Failed to send reset email: ' + (emailError instanceof Error ? emailError.message : 'Unknown error') },
          { status: 500 }
        );
      }
    } else if (method === 'sms') {
      // Send via Twilio SMS
      try {
        const formattedPhone = formatPhoneNumber(phone);
        const smsBody = `Your BraidMe password reset link: ${resetLink}\n\nThis link expires in 1 hour.`;
        
        await sendSMS({
          to: formattedPhone,
          body: smsBody,
        });

        console.log('[Password Reset] SMS sent successfully to:', phone);
      } catch (smsError) {
        console.error('[Password Reset] SMS send error:', smsError);
        return NextResponse.json(
          { success: false, error: 'Failed to send reset SMS: ' + (smsError instanceof Error ? smsError.message : 'Unknown error') },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: `Password reset link sent to your ${method}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Password Reset] Request error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
