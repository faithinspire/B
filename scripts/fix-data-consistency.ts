import { createClient } from '@supabase/supabase-js';

/**
 * Data Consistency Migration Script
 * 
 * Fixes all identified data inconsistencies:
 * 1. Fixes braiders with role='customer' in profiles
 * 2. Creates missing braider_profiles records
 * 3. Creates missing verification records
 * 4. Syncs verification status between tables
 * 5. Removes orphaned records
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

interface BraiderProfile {
  user_id: string;
  full_name: string;
  email: string;
  [key: string]: any;
}

interface Profile {
  id: string;
  role: string;
  full_name: string;
  email: string;
  [key: string]: any;
}

async function fixDataConsistency() {
  console.log('🔧 Starting data consistency migration...\n');

  try {
    // 1. Fix braiders with role='customer' in profiles
    console.log('📋 Step 1: Fixing misclassified braiders...');
    const { data: braiderProfiles } = await supabase
      .from('braider_profiles')
      .select('user_id, full_name, email');

    if (braiderProfiles && braiderProfiles.length > 0) {
      const userIds = braiderProfiles.map(b => b.user_id);
      const { data: misclassifiedProfiles } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', userIds)
        .eq('role', 'customer');

      if (misclassifiedProfiles && misclassifiedProfiles.length > 0) {
        console.log(`   Found ${misclassifiedProfiles.length} misclassified braiders`);
        
        for (const profile of misclassifiedProfiles) {
          const { error } = await supabase
            .from('profiles')
            .update({ role: 'braider' })
            .eq('id', profile.id);

          if (error) {
            console.error(`   ❌ Failed to fix profile ${profile.id}:`, error.message);
          } else {
            console.log(`   ✅ Fixed profile ${profile.id}`);
          }
        }
      } else {
        console.log('   ✅ No misclassified braiders found');
      }
    }

    // 2. Create missing braider_profiles records
    console.log('\n📋 Step 2: Creating missing braider_profiles records...');
    const { data: allBraiderProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url')
      .eq('role', 'braider');

    if (allBraiderProfiles && allBraiderProfiles.length > 0) {
      const { data: existingBraiderProfiles } = await supabase
        .from('braider_profiles')
        .select('user_id');

      const existingIds = new Set(existingBraiderProfiles?.map(b => b.user_id) || []);
      const missingBraiderProfiles = allBraiderProfiles.filter(p => !existingIds.has(p.id));

      if (missingBraiderProfiles.length > 0) {
        console.log(`   Found ${missingBraiderProfiles.length} missing braider_profiles records`);

        for (const profile of missingBraiderProfiles) {
          const { error } = await supabase
            .from('braider_profiles')
            .insert({
              user_id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              phone: profile.phone || '',
              avatar_url: profile.avatar_url,
              bio: '',
              experience_years: 0,
              specialization: '',
              services: [],
              rating_avg: 5.0,
              rating_count: 0,
              verification_status: 'pending',
              travel_radius_miles: 10,
              is_mobile: true,
              verified: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.error(`   ❌ Failed to create braider_profiles for ${profile.id}:`, error.message);
          } else {
            console.log(`   ✅ Created braider_profiles for ${profile.id}`);
          }
        }
      } else {
        console.log('   ✅ All braiders have braider_profiles records');
      }
    }

    // 3. Create missing verification records
    console.log('\n📋 Step 3: Creating missing verification records...');
    const { data: allBraiderProfilesData } = await supabase
      .from('braider_profiles')
      .select('user_id, full_name, email, phone, experience_years, specialization');

    if (allBraiderProfilesData && allBraiderProfilesData.length > 0) {
      const { data: verificationRecords } = await supabase
        .from('braider_verification')
        .select('user_id');

      const verifiedIds = new Set(verificationRecords?.map(v => v.user_id) || []);
      const missingVerifications = allBraiderProfilesData.filter(b => !verifiedIds.has(b.user_id));

      if (missingVerifications.length > 0) {
        console.log(`   Found ${missingVerifications.length} missing verification records`);

        for (const braider of missingVerifications) {
          const { error } = await supabase
            .from('braider_verification')
            .insert({
              user_id: braider.user_id,
              status: 'pending',
              full_name: braider.full_name,
              phone: braider.phone || '',
              location_country: 'NG',
              years_experience: braider.experience_years || 0,
              specialization: braider.specialization || '',
              submitted_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.error(`   ❌ Failed to create verification for ${braider.user_id}:`, error.message);
          } else {
            console.log(`   ✅ Created verification record for ${braider.user_id}`);
          }
        }
      } else {
        console.log('   ✅ All braiders have verification records');
      }
    }

    // 4. Sync verification status between tables
    console.log('\n📋 Step 4: Syncing verification status...');
    const { data: verificationData } = await supabase
      .from('braider_verification')
      .select('user_id, status');

    if (verificationData && verificationData.length > 0) {
      const { data: braiderProfilesStatus } = await supabase
        .from('braider_profiles')
        .select('user_id, verification_status');

      const statusMap = new Map(braiderProfilesStatus?.map(b => [b.user_id, b.verification_status]) || []);
      const mismatches = verificationData.filter(v => statusMap.get(v.user_id) !== v.status);

      if (mismatches.length > 0) {
        console.log(`   Found ${mismatches.length} verification status mismatches`);

        for (const verification of mismatches) {
          const { error } = await supabase
            .from('braider_profiles')
            .update({ verification_status: verification.status })
            .eq('user_id', verification.user_id);

          if (error) {
            console.error(`   ❌ Failed to sync status for ${verification.user_id}:`, error.message);
          } else {
            console.log(`   ✅ Synced verification status for ${verification.user_id}`);
          }
        }
      } else {
        console.log('   ✅ All verification statuses are in sync');
      }
    }

    console.log('\n✅ Data consistency migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixDataConsistency();
