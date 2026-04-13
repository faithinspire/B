import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Diagnostic endpoint to identify and report role issues
 * Helps troubleshoot braider login problems
 */
export async function GET(request: NextRequest) {
  try {
    // Use service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      issues: [],
      stats: {},
      recommendations: [],
    }

    // 1. Check total users
    const { data: allProfiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select('id, role')

    if (profilesError) {
      diagnostics.issues.push(`Failed to fetch profiles: ${profilesError.message}`)
      return NextResponse.json(diagnostics, { status: 400 })
    }

    diagnostics.stats.totalUsers = allProfiles?.length || 0

    // 2. Check braiders
    const { data: braiders, error: braidersError } = await serviceSupabase
      .from('braider_profiles')
      .select('user_id')
      .distinct()

    if (braidersError) {
      diagnostics.issues.push(`Failed to fetch braiders: ${braidersError.message}`)
    } else {
      diagnostics.stats.totalBraiders = braiders?.length || 0
    }

    // 3. Find braiders with wrong role
    const braiderIds = braiders?.map(b => b.user_id) || []
    const braidersWithWrongRole = allProfiles?.filter(
      p => braiderIds.includes(p.id) && p.role !== 'braider'
    ) || []

    diagnostics.stats.braidersWithWrongRole = braidersWithWrongRole.length

    if (braidersWithWrongRole.length > 0) {
      diagnostics.issues.push(
        `Found ${braidersWithWrongRole.length} braiders with wrong role in profiles table`
      )
      diagnostics.recommendations.push(
        'Run: UPDATE profiles SET role = "braider" WHERE id IN (SELECT DISTINCT user_id FROM braider_profiles) AND role != "braider"'
      )
    }

    // 4. Find customers with braider_profiles
    const customersWithBraiderProfiles = allProfiles?.filter(
      p => p.role === 'customer' && braiderIds.includes(p.id)
    ) || []

    diagnostics.stats.customersWithBraiderProfiles = customersWithBraiderProfiles.length

    if (customersWithBraiderProfiles.length > 0) {
      diagnostics.issues.push(
        `Found ${customersWithBraiderProfiles.length} customers with braider_profiles records`
      )
      diagnostics.recommendations.push(
        'These users should have role="braider" in profiles table'
      )
    }

    // 5. Check for profiles without role
    const profilesWithoutRole = allProfiles?.filter(p => !p.role) || []

    diagnostics.stats.profilesWithoutRole = profilesWithoutRole.length

    if (profilesWithoutRole.length > 0) {
      diagnostics.issues.push(
        `Found ${profilesWithoutRole.length} profiles without role`
      )
      diagnostics.recommendations.push(
        'Set role for these profiles based on braider_profiles records'
      )
    }

    // 6. Check role distribution
    const roleDistribution = {
      customer: allProfiles?.filter(p => p.role === 'customer').length || 0,
      braider: allProfiles?.filter(p => p.role === 'braider').length || 0,
      admin: allProfiles?.filter(p => p.role === 'admin').length || 0,
      unknown: allProfiles?.filter(p => !p.role).length || 0,
    }

    diagnostics.stats.roleDistribution = roleDistribution

    // 7. Check if all braiders have correct role
    const braidersWithCorrectRole = allProfiles?.filter(
      p => braiderIds.includes(p.id) && p.role === 'braider'
    ) || []

    diagnostics.stats.braidersWithCorrectRole = braidersWithCorrectRole.length
    diagnostics.stats.braidersCorrectPercentage = 
      braiderIds.length > 0 
        ? Math.round((braidersWithCorrectRole.length / braiderIds.length) * 100)
        : 100

    // 8. Generate summary
    if (diagnostics.issues.length === 0) {
      diagnostics.summary = '✅ No issues found - all roles are correct'
      diagnostics.status = 'healthy'
    } else {
      diagnostics.summary = `⚠️ Found ${diagnostics.issues.length} issue(s)`
      diagnostics.status = 'unhealthy'
    }

    // 9. Add action items
    if (diagnostics.status === 'unhealthy') {
      diagnostics.actionItems = [
        '1. Review the issues listed above',
        '2. Follow the recommendations provided',
        '3. Run the suggested SQL queries',
        '4. Re-run this diagnostic to verify fixes',
      ]
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('Diagnostic error:', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
