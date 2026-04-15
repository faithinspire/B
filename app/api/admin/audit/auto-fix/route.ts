import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auto-Fix Data Consistency Endpoint
 * 
 * Automatically fixes identified data inconsistencies:
 * - Updates braiders with role='customer' to role='braider'
 * - Creates missing braider_profiles records
 * - Creates missing verification records
 * - Syncs verification status between tables
 */
export async function POST(request: NextRequest) {
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

    const fixes: any[] = [];

    // 1. Fix misclassified braiders (role='customer' but has braider_profiles)
    const { data: braiderProfilesData } = await supabase
      .from('braider_profiles')
      .select('user_id');

    if (braiderProfilesData && braiderProfilesData.length > 0) {
      const userIds = braiderProfilesData.map(b => b.user_id);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'braider' })
        .in('id', userIds)
        .eq('role', 'customer');

      if (!updateError) {
        fixes.push({
          type: 'FIXED_MISCLASSIFIED_BRAIDERS',
          count: userIds.length,
          description: 'Updated braiders with role=customer to role=braider',
        });
      }
    }

    // 2. Create missing verification records
    const { data: braiderProfiles } = await supabase
      .from('braider_profiles')
      .select('user_id, full_name, phone, state, city, specialization');

    if (braiderProfiles && braiderProfiles.length > 0) {
      const { data: existingVerifications } = await supabase
        .from('braider_verification')
        .select('user_id');

      const existingIds = new Set(existingVerifications?.map(v => v.user_id) || []);
      const missingVerifications = braiderProfiles.filter(b => !existingIds.has(b.user_id));

      if (missingVerifications.length > 0) {
        const verificationRecords = missingVerifications.map(b => ({
          user_id: b.user_id,
          status: 'pending',
          full_name: b.full_name,
          phone: b.phone,
          location_state: b.state,
          location_city: b.city,
          specialization: b.specialization,
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from('braider_verification')
          .insert(verificationRecords);

        if (!insertError) {
          fixes.push({
            type: 'CREATED_MISSING_VERIFICATION_RECORDS',
            count: missingVerifications.length,
            description: 'Created verification records for braiders',
          });
        }
      }
    }

    // 3. Sync verification status between tables
    const { data: verifications } = await supabase
      .from('braider_verification')
      .select('user_id, status');

    if (verifications && verifications.length > 0) {
      let syncCount = 0;
      
      for (const verification of verifications) {
        const { error: syncError } = await supabase
          .from('braider_profiles')
          .update({ verification_status: verification.status })
          .eq('user_id', verification.user_id);

        if (!syncError) {
          syncCount++;
        }
      }

      if (syncCount > 0) {
        fixes.push({
          type: 'SYNCED_VERIFICATION_STATUS',
          count: syncCount,
          description: 'Synced verification status between braider_verification and braider_profiles',
        });
      }
    }

    // 4. Update verified braiders' role in profiles
    const { data: approvedVerifications } = await supabase
      .from('braider_verification')
      .select('user_id')
      .eq('status', 'approved');

    if (approvedVerifications && approvedVerifications.length > 0) {
      const approvedIds = approvedVerifications.map(v => v.user_id);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'braider' })
        .in('id', approvedIds);

      if (!updateError) {
        fixes.push({
          type: 'UPDATED_APPROVED_BRAIDERS_ROLE',
          count: approvedIds.length,
          description: 'Ensured approved braiders have role=braider in profiles',
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalFixes: fixes.length,
      fixes,
      message: 'Data consistency fixes applied successfully',
    });
  } catch (error) {
    console.error('Auto-fix error:', error);
    return NextResponse.json(
      { error: 'Failed to apply fixes' },
      { status: 500 }
    );
  }
}
