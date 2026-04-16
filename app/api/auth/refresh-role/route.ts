import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Force refresh user role from database
 * This endpoint clears any cached role and fetches the latest from the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Use service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    // Get the user's profile with fresh data
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: `Failed to fetch profile: ${profileError.message}` },
        { status: 400 }
      )
    }

    // Check if user has braider_profiles record
    const { data: braiderProfile } = await serviceSupabase
      .from('braider_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    // Determine correct role
    let correctRole = 'customer'
    if (profile?.role === 'admin') {
      correctRole = 'admin'
    } else if (profile?.role === 'braider') {
      correctRole = 'braider'
    } else if (braiderProfile) {
      correctRole = 'braider'
    }

    console.log(`=== REFRESH ROLE: User ${userId} has role ${profile?.role} in DB, correct role is ${correctRole}`)

    return NextResponse.json({
      success: true,
      userId,
      currentRole: profile?.role || 'none',
      correctRole,
      isBraider: !!braiderProfile,
      profile: {
        id: profile?.id,
        email: profile?.email,
        full_name: profile?.full_name,
        role: profile?.role,
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('Refresh role error:', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
