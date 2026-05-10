#!/usr/bin/env node

/**
 * Test script for password reset endpoints
 * Run: node test-password-reset-endpoints.mjs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

console.log('🧪 Password Reset System Test Suite');
console.log('=====================================\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Email: ${TEST_EMAIL}\n`);

async function testForgotPassword() {
  console.log('📧 Test 1: Request Password Reset');
  console.log('-----------------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ PASS: Password reset email requested\n');
      return true;
    } else {
      console.log('❌ FAIL: Unexpected response\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    return false;
  }
}

async function testInvalidEmail() {
  console.log('📧 Test 2: Invalid Email Handling');
  console.log('----------------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok && data.error) {
      console.log('✅ PASS: Invalid email rejected\n');
      return true;
    } else {
      console.log('❌ FAIL: Should reject invalid email\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    return false;
  }
}

async function testMissingEmail() {
  console.log('📧 Test 3: Missing Email Handling');
  console.log('----------------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok && data.error) {
      console.log('✅ PASS: Missing email rejected\n');
      return true;
    } else {
      console.log('❌ FAIL: Should reject missing email\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    return false;
  }
}

async function testVerifyToken() {
  console.log('🔐 Test 4: Verify Reset Token');
  console.log('------------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: 'invalid-token-for-testing',
        email: TEST_EMAIL 
      }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (!data.valid) {
      console.log('✅ PASS: Invalid token rejected\n');
      return true;
    } else {
      console.log('❌ FAIL: Should reject invalid token\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    return false;
  }
}

async function testResetPassword() {
  console.log('🔑 Test 5: Reset Password');
  console.log('-------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: 'invalid-token-for-testing',
        email: TEST_EMAIL,
        password: 'NewPassword123'
      }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok && data.error) {
      console.log('✅ PASS: Invalid token rejected\n');
      return true;
    } else {
      console.log('❌ FAIL: Should reject invalid token\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    return false;
  }
}

async function testShortPassword() {
  console.log('🔑 Test 6: Short Password Validation');
  console.log('------------------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: 'some-token',
        email: TEST_EMAIL,
        password: 'short'
      }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok && data.error) {
      console.log('✅ PASS: Short password rejected\n');
      return true;
    } else {
      console.log('❌ FAIL: Should reject short password\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Tests...\n');
  
  const results = [];
  
  results.push(await testForgotPassword());
  results.push(await testInvalidEmail());
  results.push(await testMissingEmail());
  results.push(await testVerifyToken());
  results.push(await testResetPassword());
  results.push(await testShortPassword());
  
  console.log('\n📊 Test Summary');
  console.log('================');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed`);
  }
}

runAllTests().catch(console.error);
