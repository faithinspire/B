#!/usr/bin/env node

/**
 * Test script for password reset API
 * Tests the Brevo email integration
 */

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset API...\n');

  // Wait for server to be ready
  console.log('⏳ Waiting for dev server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const testEmail = 'test@example.com';
  const apiUrl = 'http://localhost:3005/api/auth/forgot-password';

  console.log(`📧 Testing with email: ${testEmail}`);
  console.log(`🔗 API URL: ${apiUrl}\n`);

  try {
    console.log('📤 Sending request...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    const data = await response.json();
    console.log(`\n📦 Response Body:`);
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS: Password reset email request processed');
      if (data.success) {
        console.log('✅ API returned success: true');
      } else {
        console.log('⚠️  API returned success: false');
        console.log(`Error: ${data.error}`);
      }
    } else {
      console.log(`\n❌ ERROR: HTTP ${response.status}`);
      console.log(`Error: ${data.error || data.message}`);
    }

    // Test with invalid email
    console.log('\n\n🧪 Testing with invalid email...');
    const invalidResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
      }),
    });

    const invalidData = await invalidResponse.json();
    console.log(`Status: ${invalidResponse.status}`);
    console.log(`Response: ${JSON.stringify(invalidData, null, 2)}`);

    if (invalidResponse.status === 400) {
      console.log('✅ Correctly rejected invalid email');
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error);
  }
}

testPasswordReset();
