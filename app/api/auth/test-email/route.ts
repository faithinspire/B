import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Test email endpoint - verifies Resend email service is working
 * POST /api/auth/test-email
 * Body: { email: "test@example.com" }
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

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'RESEND_API_KEY not configured',
          message: 'Email service is not configured. Please add RESEND_API_KEY to environment variables.',
        },
        { status: 500 }
      );
    }

    // Check if it's a placeholder key
    if (process.env.RESEND_API_KEY.includes('your_resend_api_key')) {
      return NextResponse.json(
        {
          success: false,
          error: 'RESEND_API_KEY is a placeholder',
          message: 'Please replace RESEND_API_KEY with an actual API key from https://resend.com',
        },
        { status: 500 }
      );
    }

    console.log('Testing Resend email service...');
    console.log('API Key present:', !!process.env.RESEND_API_KEY);
    console.log('From email:', process.env.RESEND_FROM_EMAIL);

    // Import and initialize Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send test email
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@braidme.com',
      to: email,
      subject: 'BraidMe Email Service Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">BraidMe</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Email Service Test</h2>
            <p style="color: #666; line-height: 1.6;">
              ✅ If you received this email, the Resend email service is working correctly!
            </p>
            <p style="color: #666; line-height: 1.6;">
              This is a test email to verify that password reset emails will be delivered successfully.
            </p>
            <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #0066cc; margin: 0;">
                <strong>Test Details:</strong><br/>
                Email sent to: ${email}<br/>
                Service: Resend<br/>
                Timestamp: ${new Date().toISOString()}
              </p>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              You can now proceed with testing the password reset flow.
            </p>
          </div>
        </div>
      `,
    });

    console.log('Resend response:', result);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      result: {
        id: result.id,
        from: process.env.RESEND_FROM_EMAIL,
        to: email,
        subject: 'BraidMe Email Service Test',
      },
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
