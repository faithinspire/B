import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Lazy import Twilio only when needed
async function getTwilioClient() {
  try {
    const twilio = await import('twilio');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      return null;
    }
    
    return twilio.default(accountSid, authToken);
  } catch (error) {
    console.error('[Password Reset] ❌ Failed to load Twilio:', error);
    return null;
  }
}

// Send SMS via Twilio (lazy loaded)
async function sendSMS(to: string, body: string) {
  try {
    const twilioClient = await getTwilioClient();
    if (!twilioClient) {
      throw new Error('Twilio client not available');
    }

    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    console.log('[Password Reset] 📱 Sending SMS via Twilio to:', to);
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to,
    });

    console.log('[Password Reset] ✅ SMS sent successfully:', message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('[Password Reset] ❌ SMS send error:', error);
    throw error;
  }
}

// Format phone number for Twilio
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length >= 11 && !phone.startsWith('+')) {
    return `+${cleaned}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
}

// Check if Twilio is configured
function isTwilioConfigured(): boolean {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  return !!(accountSid && authToken && fromNumber);
}

// Validate Brevo configuration
function validateBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME;

  if (!apiKey) {
    console.error('[Password Reset] ❌ BREVO_API_KEY is not configured');
    return false;
  }
  if (!fromEmail) {
    console.error('[Password Reset] ❌ BREVO_FROM_EMAIL is not configured');
    return false;
  }
  if (!fromName) {
    console.error('[Password Reset] ❌ BREVO_FROM_NAME is not configured');
    return false;
  }

  console.log('[Password Reset] ✅ Brevo configuration validated');
  console.log('[Password Reset] From:', `${fromName} <${fromEmail}>`);
  return true;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Validate Brevo configuration first
    if (!validateBrevoConfig()) {
      return NextResponse.json(
        { success: false, error: 'Email service is not properly configured. Please contact support.' },
        { status: 500 }
      );
    }

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
    console.log(`[Password Reset] 📧 Request received for ${method}:`, contactInfo);

    // Check if user exists in auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('[Password Reset] ❌ Auth list error:', authError);
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
      console.log(`[Password Reset] ℹ️ User not found for ${method}:`, contactInfo);
      // Don't reveal if account exists for security
      return NextResponse.json(
        { success: true, message: `If an account exists with this ${method}, you will receive a password reset link.` },
        { status: 200 }
      );
    }

    console.log(`[Password Reset] ✅ User found, generating token for ${method}:`, contactInfo);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    console.log('[Password Reset] 🔐 Token generated, storing in database');

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
      console.error('[Password Reset] ❌ Token storage error:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate reset token: ' + tokenError.message },
        { status: 500 }
      );
    }

    console.log('[Password Reset] ✅ Token stored successfully');

    // Send reset link via email or SMS
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/update-password?token=${resetToken}&${method === 'email' ? 'email' : 'phone'}=${encodeURIComponent(contactInfo)}`;

    console.log(`[Password Reset] 📤 Sending ${method} to:`, contactInfo);

    if (method === 'email') {
      // Send via Brevo email
      try {
        const brevoApiKey = process.env.BREVO_API_KEY;
        const brevoFromEmail = process.env.BREVO_FROM_EMAIL;
        const brevoFromName = process.env.BREVO_FROM_NAME;

        console.log('[Password Reset] 🔄 Calling Brevo API...');

        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: brevoFromName || 'BraidMe',
              email: brevoFromEmail || 'noreply@braidme.com',
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

        if (!brevoResponse.ok) {
          console.error('[Password Reset] ❌ Brevo API error:', responseText);
          console.error('[Password Reset] ❌ Status:', brevoResponse.status);
          console.error('[Password Reset] ❌ Headers:', Object.fromEntries(brevoResponse.headers));
          
          return NextResponse.json(
            { success: false, error: `Failed to send reset email. Brevo error: ${brevoResponse.status}` },
            { status: 500 }
          );
        }

        console.log('[Password Reset] ✅ Email sent successfully to:', email);
        console.log('[Password Reset] Brevo response:', responseText);
      } catch (emailError) {
        console.error('[Password Reset] ❌ Email send error:', emailError);
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
        
        await sendSMS(formattedPhone, smsBody);

        console.log('[Password Reset] ✅ SMS sent successfully to:', phone);
      } catch (smsError) {
        console.error('[Password Reset] ❌ SMS send error:', smsError);
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
    console.error('[Password Reset] ❌ Request error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
