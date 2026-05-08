#!/usr/bin/env node

/**
 * Test script to verify Brevo SMTP API is working correctly
 */

const BREVO_API_KEY = 'xsmtpsib-54496d9e530d514faaeee82df32b1de2e44151778e69476f867e25c2ba5c7ae1';
const BREVO_FROM_EMAIL = 'noreply@braidme.com';
const BREVO_FROM_NAME = 'BraidMe';

async function testBrevoEmail() {
  console.log('🧪 Testing Brevo SMTP API...\n');

  try {
    console.log('📧 Configuration:');
    console.log(`  From: ${BREVO_FROM_NAME} <${BREVO_FROM_EMAIL}>`);
    console.log(`  API Key Length: ${BREVO_API_KEY.length}`);
    console.log(`  API Key Valid: ${BREVO_API_KEY.startsWith('xsmtpsib-')}\n`);

    // Test 1: Verify API key format
    if (!BREVO_API_KEY.startsWith('xsmtpsib-')) {
      throw new Error('❌ Invalid Brevo API key format - should start with xsmtpsib-');
    }
    console.log('✅ API key format is valid\n');

    // Test 2: Send test email
    console.log('📤 Sending test email via Brevo API...');
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_FROM_NAME,
          email: BREVO_FROM_EMAIL,
        },
        to: [
          {
            email: 'test@example.com',
            name: 'Test User',
          },
        ],
        subject: 'BraidMe Password Reset Test',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Password Reset Test</h2>
            <p>This is a test email from BraidMe to verify Brevo SMTP integration is working.</p>
            <p>If you received this, the email system is functioning correctly!</p>
          </div>
        `,
        replyTo: {
          email: BREVO_FROM_EMAIL,
          name: BREVO_FROM_NAME,
        },
      }),
    });

    const responseData = await response.json();

    console.log(`\n📊 Brevo Response:`);
    console.log(`  Status: ${response.status}`);
    console.log(`  OK: ${response.ok}`);
    console.log(`  Message ID: ${responseData.messageId || 'N/A'}`);
    console.log(`  Full Response:`, JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('\n❌ Brevo API Error:');
      console.error(JSON.stringify(responseData, null, 2));
      return false;
    }

    if (!responseData.messageId) {
      console.error('\n❌ No message ID returned from Brevo');
      return false;
    }

    console.log('\n✅ Test email sent successfully!');
    console.log(`   Message ID: ${responseData.messageId}`);
    return true;

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Run test
testBrevoEmail().then(success => {
  process.exit(success ? 0 : 1);
});
