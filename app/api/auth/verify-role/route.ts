import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify and fix user role
 * This endpoint checks if a user's role is correct based on their profile and braider_profiles records
 * If the role is wrong, it fixes it
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

    // 1. Get the user's profile
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

    // 2. Check if user has braider_profiles record
    const { data: braiderProfile, error: braiderError } = await serviceSupabase
      .from('braider_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    // Determine correct role
    let correctRole = 'customer'
    if (braiderProfile) {
      correctRole = 'braider'
    } else if (profile?.role === 'admin') {
      correctRole = 'admin'
    }

    // 3. If profile doesn't exist, create it
    if (!profile) {
      console.log(`Creating profile for user ${userId} with role ${correctRole}`)
      const { error: createError } = await serviceSupabase
        .from('profiles')
        .insert({
          id: userId,
          role: correctRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (createError) {
        console.error('Failed to create profile:', createError)
        return NextResponse.json(
          { error: `Failed to create profile: ${createError.message}` },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        role: correctRole,
        message: `Created profile with role ${correctRole}`,
      })
    }

    // 4. If role is wrong, update it
    if (profile.role !== correctRole) {
      console.log(`Updating user ${userId} role from ${profile.role} to ${correctRole}`)
      const { error: updateError } = await serviceSupabase
        .from('profiles')
        .update({
          role: correctRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
        return NextResponse.json(
          { error: `Failed to update profile: ${updateError.message}` },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'updated',
        oldRole: profile.role,
        newRole: correctRole,
        message: `Updated role from ${profile.role} to ${correctRole}`,
      })
    }

    // 5. Role is already correct
    return NextResponse.json({
      success: true,
      action: 'verified',
      role: profile.role,
      message: `Role is correct: ${profile.role}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('Verify role error:', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
