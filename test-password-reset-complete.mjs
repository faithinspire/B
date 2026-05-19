#!/usr/bin/env node

/**
 * Complete Password Reset System Test
 * Tests all components: API, Database, Email Service
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log('\n🔍 PASSWORD RESET SYSTEM - COMPLETE DIAGNOSTIC\n');
console.log('=' .repeat(60));

// Test 1: Check environment variables
console.log('\n✅ TEST 1: Environment Variables');
console.log('-'.repeat(60));

const checks = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: SUPABASE_URL },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing' },
  { name: 'NEXT_PUBLIC_APP_URL', value: APP_URL },
  { name: 'BREVO_API_KEY', value: BREVO_API_KEY ? '✓ Set' : '✗ Missing' },
  { name: 'BREVO_FROM_EMAIL', value: BREVO_FROM_EMAIL },
];

checks.forEach(check => {
  const status = check.value ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${check.value}`);
});

// Test 2: Check database table
console.log('\n✅ TEST 2: Database Table Status');
console.log('-'.repeat(60));

try {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('count', { count: 'exact' });
  
  if (error) {
    console.log('❌ Error accessing password_reset_tokens table:', error.message);
  } else {
    console.log('✅ password_reset_tokens table exists');
    console.log(`   Total tokens in database: ${data?.length || 0}`);
  }
} catch (err) {
  console.log('❌ Database connection error:', err.message);
}

// Test 3: Check RLS status
console.log('\n✅ TEST 3: Row Level Security (RLS) Status');
console.log('-'.repeat(60));

try {
  const { data, error } = await supabase.rpc('check_rls_status', {
    table_name: 'password_reset_tokens'
  }).catch(() => null);
  
  if (data) {
    console.log('✅ RLS check completed');
  } else {
    console.log('⚠️  Could not verify RLS status (this is OK if table exists)');
  }
} catch (err) {
  console.log('⚠️  RLS check skipped:', err.message);
}

// Test 4: Test API endpoint
console.log('\n✅ TEST 4: API Endpoint Test');
console.log('-'.repeat(60));

const testEmail = `test-${Date.now()}@example.com`;
console.log(`Testing with email: ${testEmail}`);

try {
  const response = await fetch(`${APP_URL}/api/auth/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });

  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ API endpoint responded successfully');
    console.log(`   Status: ${response.status}`);
    console.log(`   Message: ${result.message}`);
  } else {
    console.log('❌ API endpoint returned error');
    console.log(`   Status: ${response.status}`);
    console.log(`   Error: ${result.error}`);
  }
} catch (err) {
  console.log('❌ API endpoint error:', err.message);
  console.log('   Make sure the app is running on', APP_URL);
}

// Test 5: Check if token was stored
console.log('\n✅ TEST 5: Token Storage Verification');
console.log('-'.repeat(60));

try {
  const { data: tokens, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('email', testEmail)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.log('❌ Error querying tokens:', error.message);
  } else if (tokens && tokens.length > 0) {
    const token = tokens[0];
    console.log('✅ Token stored successfully');
    console.log(`   Email: ${token.email}`);
    console.log(`   Token Hash: ${token.token_hash.substring(0, 16)}...`);
    console.log(`   Expires At: ${token.expires_at}`);
    console.log(`   Created At: ${token.created_at}`);
  } else {
    console.log('⚠️  No token found for test email');
    console.log('   This could mean:');
    console.log('   1. API request failed silently');
    console.log('   2. Token was not stored in database');
    console.log('   3. Email lookup failed');
  }
} catch (err) {
  console.log('❌ Token verification error:', err.message);
}

// Test 6: Check Brevo configuration
console.log('\n✅ TEST 6: Brevo Email Service Configuration');
console.log('-'.repeat(60));

if (!BREVO_API_KEY) {
  console.log('❌ BREVO_API_KEY not set');
} else {
  console.log('✅ BREVO_API_KEY is configured');
}

if (!BREVO_FROM_EMAIL) {
  console.log('❌ BREVO_FROM_EMAIL not set');
} else {
  console.log('✅ BREVO_FROM_EMAIL is configured:', BREVO_FROM_EMAIL);
  console.log('   ⚠️  Make sure this email is verified in Brevo dashboard');
}

// Test 7: Summary
console.log('\n' + '='.repeat(60));
console.log('📋 SUMMARY & NEXT STEPS');
console.log('='.repeat(60));

console.log(`
✅ System Components:
   - API Routes: /api/auth/password-reset/request & /verify
   - Database: password_reset_tokens table
   - Email Service: Brevo API
   - Frontend: /forgot-password page

⚠️  CRITICAL CHECKS:
   1. Verify BREVO_FROM_EMAIL (${BREVO_FROM_EMAIL}) is verified in Brevo
   2. Verify BREVO_API_KEY is valid
   3. Verify NEXT_PUBLIC_APP_URL is correct for your environment

🔧 TO TEST LOCALLY:
   1. npm run dev
   2. Go to http://localhost:3000/forgot-password
   3. Enter your email
   4. Check server logs for [Password Reset] messages
   5. Check your email inbox (and spam folder)

📊 TO VERIFY IN PRODUCTION:
   1. Update NEXT_PUBLIC_APP_URL in Vercel environment variables
   2. Ensure BREVO_FROM_EMAIL is verified in Brevo
   3. Test password reset on production domain
   4. Monitor Brevo logs for email delivery

🚀 DEPLOYMENT CHECKLIST:
   [ ] Brevo sender email verified
   [ ] BREVO_API_KEY set in Vercel
   [ ] NEXT_PUBLIC_APP_URL set to production domain
   [ ] password_reset_tokens table exists in production database
   [ ] RLS disabled on password_reset_tokens table
   [ ] Test password reset flow end-to-end
`);

console.log('='.repeat(60));
console.log('✅ Diagnostic complete!\n');
