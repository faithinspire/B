import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify password reset email configuration
 * GET /api/auth/test-password-reset
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Test Password Reset] Starting configuration check...');

    // Check environment variables
    const checks = {
      BREVO_API_KEY: !!process.env.BREVO_API_KEY,
      BREVO_FROM_EMAIL: !!process.env.BREVO_FROM_EMAIL,
      BREVO_FROM_NAME: !!process.env.BREVO_FROM_NAME,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    console.log('[Test Password Reset] Configuration checks:', checks);

    // Verify Brevo API key format
    const brevoKey = process.env.BREVO_API_KEY;
    const brevoKeyValid = brevoKey?.startsWith('xkeysib-') && brevoKey?.length > 50;

    // Verify email format
    const brevoEmail = process.env.BREVO_FROM_EMAIL;
    const brevoEmailValid = brevoEmail?.includes('@') && brevoEmail?.includes('braidme.com');

    console.log('[Test Password Reset] Brevo API Key valid:', brevoKeyValid);
    console.log('[Test Password Reset] Brevo From Email valid:', brevoEmailValid);
    console.log('[Test Password Reset] Brevo From Email:', brevoEmail);

    // Test Brevo API connection
    let brevoConnected = false;
    let brevoError = null;

    try {
      console.log('[Test Password Reset] Testing Brevo API connection...');
      const testResponse = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Test Password Reset] Brevo API response status:', testResponse.status);

      if (testResponse.ok) {
        brevoConnected = true;
        const accountData = await testResponse.json();
        console.log('[Test Password Reset] Brevo account info:', {
          email: accountData.email,
          firstName: accountData.firstName,
          lastName: accountData.lastName,
        });
      } else {
        const errorText = await testResponse.text();
        brevoError = `HTTP ${testResponse.status}: ${errorText}`;
        console.error('[Test Password Reset] Brevo API error:', brevoError);
      }
    } catch (error) {
      brevoError = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Test Password Reset] Brevo connection error:', brevoError);
    }

    const allChecks = {
      environment: checks,
      brevoApiKeyValid: brevoKeyValid,
      brevoEmailValid: brevoEmailValid,
      brevoConnected,
      brevoError,
      summary: {
        ready: brevoConnected && brevoKeyValid && brevoEmailValid && checks.BREVO_API_KEY,
        message: brevoConnected
          ? '✅ Password reset email system is ready!'
          : '❌ Password reset email system has issues',
      },
    };

    console.log('[Test Password Reset] Final check result:', allChecks);

    return NextResponse.json(allChecks, { status: 200 });
  } catch (error) {
    console.error('[Test Password Reset] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
