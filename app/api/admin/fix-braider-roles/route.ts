import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin endpoint to fix all braider roles in batch
 * This endpoint updates all braiders to have role='braider' in the profiles table
 * Only accessible with service role key
 */
export async function POST(request: NextRequest) {
  try {
    // Use service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    // 1. Find all braiders (users with braider_profiles records)
    const { data: braiders, error: braiderError } = await serviceSupabase
      .from('braider_profiles')
      .select('user_id', { distinct: true })

    if (braiderError) {
      return NextResponse.json(
        { error: `Failed to fetch braiders: ${braiderError.message}` },
        { status: 400 }
      )
    }

    if (!braiders || braiders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No braiders found',
        fixed: 0,
        verified: 0,
      })
    }

    const braiderIds = braiders.map(b => b.user_id)
    console.log(`Found ${braiderIds.length} braiders to check`)

    // 2. Get all profiles for these braiders
    const { data: profiles, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, role')
      .in('id', braiderIds)

    if (profileError) {
      return NextResponse.json(
        { error: `Failed to fetch profiles: ${profileError.message}` },
        { status: 400 }
      )
    }

    // 3. Find braiders with wrong role
    const braiderIdsWithWrongRole = profiles
      ?.filter(p => p.role !== 'braider')
      .map(p => p.id) || []

    console.log(`Found ${braiderIdsWithWrongRole.length} braiders with wrong role`)

    // 4. Update all braiders with wrong role
    let fixed = 0
    if (braiderIdsWithWrongRole.length > 0) {
      const { error: updateError } = await serviceSupabase
        .from('profiles')
        .update({
          role: 'braider',
          updated_at: new Date().toISOString(),
        })
        .in('id', braiderIdsWithWrongRole)

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update profiles: ${updateError.message}` },
          { status: 400 }
        )
      }

      fixed = braiderIdsWithWrongRole.length
      console.log(`Fixed ${fixed} braider roles`)
    }

    // 5. Verify all braiders now have correct role
    const { data: verifiedProfiles, error: verifyError } = await serviceSupabase
      .from('profiles')
      .select('id, role')
      .in('id', braiderIds)

    if (verifyError) {
      return NextResponse.json(
        { error: `Failed to verify profiles: ${verifyError.message}` },
        { status: 400 }
      )
    }

    const verified = verifiedProfiles?.filter(p => p.role === 'braider').length || 0

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} braider roles, verified ${verified}/${braiderIds.length}`,
      total: braiderIds.length,
      fixed,
      verified,
      details: {
        braiderIds,
        fixedIds: braiderIdsWithWrongRole,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('Fix braider roles error:', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
