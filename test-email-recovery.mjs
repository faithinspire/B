#!/usr/bin/env node

/**
 * Test password recovery email sending
 * Run: node test-email-recovery.mjs
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

async function testPasswordReset() {
  console.log('🧪 Testing password recovery email...\n');
  console.log(`📧 Email: ${TEST_EMAIL}`);
  console.log(`🌐 API: ${API_URL}\n`);

  try {
    console.log('📤 Sending password reset request...');
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
      }),
    });

    const data = await response.json();

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Password reset email sent successfully!');
      console.log('📧 Check your email for the reset link.');
      return true;
    } else {
      console.log('\n❌ Failed to send password reset email');
      console.log('🔍 Error details:', data.error);
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return false;
  }
}

testPasswordReset().then(success => {
  process.exit(success ? 0 : 1);
});
