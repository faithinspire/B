import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

async function diagnoseStats() {
  try {
    console.log('=== DIAGNOSTIC: User Stats Analysis ===\n');

    // Get all auth users
    let allAuthUsers: any[] = [];
    let pageNumber = 0;
    const pageSize = 50;
    let hasMore = true;

    while (hasMore) {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page: pageNumber,
        perPage: pageSize,
      });

      if (error || !users) break;
      allAuthUsers = allAuthUsers.concat(users);
      
      if (users.length < pageSize) {
        hasMore = false;
      } else {
        pageNumber++;
      }
    }

    console.log(`Total Auth Users: ${allAuthUsers.length}`);

    // Get all profiles
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, role, email');

    console.log(`Total Profiles: ${allProfiles?.length || 0}`);

    // Count by role
    const roleCounts = {
      admin: allProfiles?.filter(p => p.role === 'admin').length || 0,
      braider: allProfiles?.filter(p => p.role === 'braider').length || 0,
      customer: allProfiles?.filter(p => p.role === 'customer').length || 0,
    };

    console.log(`\nRole Breakdown:`);
    console.log(`  Admins: ${roleCounts.admin}`);
    console.log(`  Braiders: ${roleCounts.braider}`);
    console.log(`  Customers: ${roleCounts.customer}`);
    console.log(`  Total: ${roleCounts.admin + roleCounts.braider + roleCounts.customer}`);

    // Get braider profiles
    const { data: braiderProfiles } = await supabase
      .from('braider_profiles')
      .select('user_id, verification_status');

    console.log(`\nBraider Profiles: ${braiderProfiles?.length || 0}`);

    // Check for mismatches
    const braiderUserIds = new Set(braiderProfiles?.map(b => b.user_id) || []);
    const profileBraiderIds = new Set(allProfiles?.filter(p => p.role === 'braider').map(p => p.id) || []);

    console.log(`\nMismatch Analysis:`);
    console.log(`  Braider profiles without braider role: ${braiderUserIds.size - [...braiderUserIds].filter(id => profileBraiderIds.has(id)).length}`);
    console.log(`  Braider roles without braider profile: ${profileBraiderIds.size - [...profileBraiderIds].filter(id => braiderUserIds.has(id)).length}`);

    // Check verification statuses
    const verificationStats = {
      pending: braiderProfiles?.filter(b => b.verification_status === 'pending').length || 0,
      approved: braiderProfiles?.filter(b => b.verification_status === 'approved').length || 0,
      rejected: braiderProfiles?.filter(b => b.verification_status === 'rejected').length || 0,
      unverified: braiderProfiles?.filter(b => b.verification_status === 'unverified').length || 0,
    };

    console.log(`\nVerification Status Breakdown:`);
    console.log(`  Pending: ${verificationStats.pending}`);
    console.log(`  Approved: ${verificationStats.approved}`);
    console.log(`  Rejected: ${verificationStats.rejected}`);
    console.log(`  Unverified: ${verificationStats.unverified}`);

  } catch (error) {
    console.error('Diagnostic error:', error);
  }
}

diagnoseStats();
