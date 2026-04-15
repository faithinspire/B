import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Data Consistency Audit Endpoint
 * 
 * Identifies and reports data inconsistencies:
 * - Braiders with role='customer' in profiles
 * - Braiders with no braider_profiles record
 * - Braiders with no verification record
 * - Orphaned braider_profiles records
 * - Mismatched verification status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const issues: any[] = [];

    // 1. Find braiders with role='customer' in profiles
    const { data: misclassifiedBraiders } = await supabase
      .from('braider_profiles')
      .select('user_id, full_name, email')
      .then(async (result) => {
        if (!result.data) return { data: [] };
        
        const userIds = result.data.map(b => b.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, role, full_name, email')
          .in('id', userIds)
          .eq('role', 'customer');
        
        return { data: profiles || [] };
      });

    if (misclassifiedBraiders && misclassifiedBraiders.length > 0) {
      issues.push({
        type: 'MISCLASSIFIED_BRAIDERS',
        severity: 'CRITICAL',
        count: misclassifiedBraiders.length,
        description: 'Braiders with role=customer in profiles table',
        records: misclassifiedBraiders,
      });
    }

    // 2. Find braiders with no braider_profiles record
    const { data: allBraiderProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'braider');

    if (allBraiderProfiles && allBraiderProfiles.length > 0) {
      const { data: existingBraiderProfiles } = await supabase
        .from('braider_profiles')
        .select('user_id');

      const existingIds = new Set(existingBraiderProfiles?.map(b => b.user_id) || []);
      const missingBraiderProfiles = allBraiderProfiles.filter(b => !existingIds.has(b.id));

      if (missingBraiderProfiles.length > 0) {
        issues.push({
          type: 'MISSING_BRAIDER_PROFILES',
          severity: 'CRITICAL',
          count: missingBraiderProfiles.length,
          description: 'Braiders with no braider_profiles record',
          records: missingBraiderProfiles,
        });
      }
    }

    // 3. Find braiders with no verification record
    const { data: allBraiderProfilesData } = await supabase
      .from('braider_profiles')
      .select('user_id, full_name, email');

    if (allBraiderProfilesData && allBraiderProfilesData.length > 0) {
      const { data: verificationRecords } = await supabase
        .from('braider_verification')
        .select('user_id');

      const verifiedIds = new Set(verificationRecords?.map(v => v.user_id) || []);
      const missingVerifications = allBraiderProfilesData.filter(b => !verifiedIds.has(b.user_id));

      if (missingVerifications.length > 0) {
        issues.push({
          type: 'MISSING_VERIFICATION_RECORDS',
          severity: 'HIGH',
          count: missingVerifications.length,
          description: 'Braiders with no verification record',
          records: missingVerifications,
        });
      }
    }

    // 4. Find orphaned braider_profiles records (user doesn't exist in auth)
    const { data: braiderProfilesData } = await supabase
      .from('braider_profiles')
      .select('user_id, full_name, email');

    if (braiderProfilesData && braiderProfilesData.length > 0) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUserIds = new Set(authUsers?.users.map(u => u.id) || []);
      const orphanedRecords = braiderProfilesData.filter(b => !authUserIds.has(b.user_id));

      if (orphanedRecords.length > 0) {
        issues.push({
          type: 'ORPHANED_BRAIDER_PROFILES',
          severity: 'HIGH',
          count: orphanedRecords.length,
          description: 'Braider profiles with no corresponding auth user',
          records: orphanedRecords,
        });
      }
    }

    // 5. Find verification status mismatches
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
        issues.push({
          type: 'VERIFICATION_STATUS_MISMATCH',
          severity: 'MEDIUM',
          count: mismatches.length,
          description: 'Verification status differs between braider_verification and braider_profiles',
          records: mismatches,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalIssues: issues.length,
      issues,
      summary: {
        critical: issues.filter(i => i.severity === 'CRITICAL').length,
        high: issues.filter(i => i.severity === 'HIGH').length,
        medium: issues.filter(i => i.severity === 'MEDIUM').length,
      },
    });
  } catch (error) {
    console.error('Data consistency audit error:', error);
    return NextResponse.json(
      { error: 'Failed to run audit' },
      { status: 500 }
    );
  }
}
