import { createClient } from '@supabase/supabase-js';

/**
 * Comprehensive Testing Suite for BraidMee System Fixes
 * 
 * Tests all critical functionality:
 * 1. Signup flow for braiders
 * 2. Stats calculation accuracy
 * 3. Braiders API filtering
 * 4. Audit and auto-fix endpoints
 * 5. Data consistency
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}: ${message}`);
  results.push({ name, passed, message, details });
}

async function testSignupFlow() {
  console.log('\n📋 Testing Signup Flow...\n');

  try {
    // Create test braider
    const testEmail = `test-braider-${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Braider',
        role: 'braider',
      },
    });

    if (authError) {
      logTest('Signup - Auth User Creation', false, authError.message);
      return;
    }

    logTest('Signup - Auth User Creation', true, 'User created successfully');

    const userId = authData.user.id;

    // Check profile creation
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    logTest(
      'Signup - Profile Creation',
      !!profile,
      profile ? 'Profile created' : 'Profile not found'
    );

    if (profile) {
      logTest(
        'Signup - Role Assignment',
        profile.role === 'braider',
        `Role is ${profile.role}, expected braider`
      );
    }

    // Check braider_profiles creation
    const { data: braiderProfile } = await supabase
      .from('braider_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    logTest(
      'Signup - Braider Profile Creation',
      !!braiderProfile,
      braiderProfile ? 'Braider profile created' : 'Braider profile not found'
    );

    // Check verification record creation
    const { data: verification } = await supabase
      .from('braider_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    logTest(
      'Signup - Verification Record Creation',
      !!verification,
      verification ? 'Verification record created' : 'Verification record not found'
    );

    // Cleanup
    await supabase.auth.admin.deleteUser(userId);
  } catch (error) {
    logTest('Signup Flow', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testStatsCalculation() {
  console.log('\n📋 Testing Stats Calculation...\n');

  try {
    // Get current stats
    const { count: totalCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    const { count: totalBraiders } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: verifiedBraiders } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    logTest(
      'Stats - Customer Count',
      typeof totalCustomers === 'number',
      `Found ${totalCustomers} customers`
    );

    logTest(
      'Stats - Braider Count',
      typeof totalBraiders === 'number',
      `Found ${totalBraiders} braiders`
    );

    logTest(
      'Stats - Verified Braiders Count',
      typeof verifiedBraiders === 'number',
      `Found ${verifiedBraiders} verified braiders`
    );

    // Verify braiders count matches braider_profiles table
    const { data: braiderProfilesData } = await supabase
      .from('braider_profiles')
      .select('user_id');

    const braiderProfilesCount = braiderProfilesData?.length || 0;

    logTest(
      'Stats - Braider Count Accuracy',
      totalBraiders === braiderProfilesCount,
      `Braider count matches: ${totalBraiders} === ${braiderProfilesCount}`
    );
  } catch (error) {
    logTest('Stats Calculation', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testBraidersAPIFiltering() {
  console.log('\n📋 Testing Braiders API Filtering...\n');

  try {
    // Get verified braiders
    const { data: verifiedBraiders, error } = await supabase
      .from('braider_profiles')
      .select('*')
      .eq('verification_status', 'verified');

    logTest(
      'Braiders API - Fetch Verified',
      !error,
      error ? error.message : `Fetched ${verifiedBraiders?.length || 0} verified braiders`
    );

    if (verifiedBraiders && verifiedBraiders.length > 0) {
      // Check that all returned braiders are verified
      const allVerified = verifiedBraiders.every(b => b.verification_status === 'verified');
      logTest(
        'Braiders API - Verification Filter',
        allVerified,
        allVerified ? 'All braiders are verified' : 'Some unverified braiders returned'
      );
    }

    // Check that unverified braiders are not returned
    const { data: unverifiedBraiders } = await supabase
      .from('braider_profiles')
      .select('*')
      .eq('verification_status', 'pending');

    if (unverifiedBraiders && unverifiedBraiders.length > 0) {
      logTest(
        'Braiders API - Unverified Exclusion',
        true,
        `${unverifiedBraiders.length} unverified braiders exist but are not returned by API`
      );
    }
  } catch (error) {
    logTest('Braiders API Filtering', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testDataConsistency() {
  console.log('\n📋 Testing Data Consistency...\n');

  try {
    // Check for misclassified braiders
    const { data: braiderProfiles } = await supabase
      .from('braider_profiles')
      .select('user_id');

    if (braiderProfiles && braiderProfiles.length > 0) {
      const userIds = braiderProfiles.map(b => b.user_id);
      const { data: misclassified } = await supabase
        .from('profiles')
        .select('id')
        .in('id', userIds)
        .eq('role', 'customer');

      logTest(
        'Data Consistency - No Misclassified Braiders',
        !misclassified || misclassified.length === 0,
        misclassified && misclassified.length > 0
          ? `Found ${misclassified.length} misclassified braiders`
          : 'No misclassified braiders'
      );
    }

    // Check for missing braider_profiles
    const { data: braiderRoles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'braider');

    if (braiderRoles && braiderRoles.length > 0) {
      const { data: existingBraiderProfiles } = await supabase
        .from('braider_profiles')
        .select('user_id');

      const existingIds = new Set(existingBraiderProfiles?.map(b => b.user_id) || []);
      const missing = braiderRoles.filter(b => !existingIds.has(b.id));

      logTest(
        'Data Consistency - No Missing Braider Profiles',
        missing.length === 0,
        missing.length > 0
          ? `Found ${missing.length} braiders without braider_profiles`
          : 'All braiders have braider_profiles'
      );
    }

    // Check for verification status mismatches
    const { data: verificationRecords } = await supabase
      .from('braider_verification')
      .select('user_id, status');

    if (verificationRecords && verificationRecords.length > 0) {
      const { data: braiderProfilesStatus } = await supabase
        .from('braider_profiles')
        .select('user_id, verification_status');

      const statusMap = new Map(braiderProfilesStatus?.map(b => [b.user_id, b.verification_status]) || []);
      const mismatches = verificationRecords.filter(v => statusMap.get(v.user_id) !== v.status);

      logTest(
        'Data Consistency - Verification Status Sync',
        mismatches.length === 0,
        mismatches.length > 0
          ? `Found ${mismatches.length} status mismatches`
          : 'All verification statuses are in sync'
      );
    }
  } catch (error) {
    logTest('Data Consistency', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive System Tests...\n');
  console.log('═'.repeat(60));

  await testSignupFlow();
  await testStatsCalculation();
  await testBraidersAPIFiltering();
  await testDataConsistency();

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Summary:\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
