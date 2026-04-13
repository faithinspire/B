import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Enhanced signup endpoint with profile verification
 * Ensures profile is created and verified before returning
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      full_name, 
      role,
      phone,
      phone_country,
      specialization,
      years_experience,
      services,
      bio,
    } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, role' },
        { status: 400 }
      )
    }

    if (!['braider', 'customer', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be braider, customer, or admin' },
        { status: 400 }
      )
    }

    // Use service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    // 1. Create auth user
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        phone,
        phone_country,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    console.log(`=== SIGNUP: Created auth user ${userId} with role ${role} ===`)

    // 2. Create profile record with EXPLICIT role - CRITICAL for auth
    let profileCreated = false
    let retries = 5

    while (retries > 0 && !profileCreated) {
      try {
        const { error: profileError } = await serviceSupabase
          .from('profiles')
          .insert({
            id: userId,
            email,
            full_name,
            role, // EXPLICIT role - MUST be set here
            phone,
            phone_country,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // No rows returned - try upsert
            const { error: upsertError } = await serviceSupabase
              .from('profiles')
              .upsert({
                id: userId,
                email,
                full_name,
                role,
                phone,
                phone_country,
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'id',
              })

            if (upsertError) {
              console.error(`Profile upsert error (attempt ${6 - retries}):`, upsertError)
              retries--
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 200 * (6 - retries)))
              }
              continue
            }
          } else {
            throw profileError
          }
        }

        profileCreated = true
        console.log(`=== SIGNUP: Profile created for user ${userId} with role ${role} ===`)
      } catch (err) {
        console.error(`Profile creation error (attempt ${6 - retries}):`, err)
        retries--
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200 * (6 - retries)))
        }
      }
    }

    if (!profileCreated) {
      console.error(`Failed to create profile for user ${userId} after 5 attempts`)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // 3. Verify profile was created with correct role
    let profileVerified = false
    let verifyRetries = 5

    while (verifyRetries > 0 && !profileVerified) {
      try {
        const { data: profile, error: verifyError } = await serviceSupabase
          .from('profiles')
          .select('id, role')
          .eq('id', userId)
          .single()

        if (verifyError) {
          console.warn(`Profile verification error (attempt ${6 - verifyRetries}):`, verifyError)
          verifyRetries--
          if (verifyRetries > 0) {
            await new Promise(resolve => setTimeout(resolve, 200 * (6 - verifyRetries)))
          }
          continue
        }

        if (profile && profile.role === role) {
          profileVerified = true
          console.log(`=== SIGNUP: Profile verified with correct role ${role} ===`)
        } else {
          console.warn(`Profile has wrong role: ${profile?.role} (expected ${role})`)
          verifyRetries--
          if (verifyRetries > 0) {
            await new Promise(resolve => setTimeout(resolve, 200 * (6 - verifyRetries)))
          }
        }
      } catch (err) {
        console.error(`Profile verification error (attempt ${6 - verifyRetries}):`, err)
        verifyRetries--
        if (verifyRetries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200 * (6 - verifyRetries)))
        }
      }
    }

    if (!profileVerified) {
      console.error(`Failed to verify profile for user ${userId} after 5 attempts`)
      return NextResponse.json(
        { error: 'Failed to verify user profile' },
        { status: 500 }
      )
    }

    // 4. If braider, create braider_profiles record
    if (role === 'braider') {
      const { 
        state, 
        city, 
        address,
        id_type,
        id_number,
        id_document_url,
        next_of_kin_name,
        next_of_kin_phone,
        next_of_kin_relationship,
      } = body

      try {
        const { error: braiderError } = await serviceSupabase
          .from('braider_profiles')
          .insert({
            id: `braider_${userId}`,
            user_id: userId,
            full_name,
            email,
            phone,
            avatar_url: null,
            bio: bio || '',
            experience_years: years_experience || 0,
            specialization: specialization || '',
            services: services || [],
            rating_avg: 5.0,
            rating_count: 0,
            verification_status: 'pending',
            travel_radius_miles: 10,
            is_mobile: true,
            salon_address: address || null,
            specialties: specialization ? [specialization] : [],
            total_earnings: 0,
            available_balance: 0,
            state: state || null,
            city: city || null,
            address: address || null,
            verified: false,
            next_of_kin_name: next_of_kin_name || null,
            next_of_kin_phone: next_of_kin_phone || null,
            next_of_kin_relationship: next_of_kin_relationship || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (braiderError) {
          console.error('Braider profile error:', braiderError)
          // Try upsert as fallback
          const { error: upsertError } = await serviceSupabase
            .from('braider_profiles')
            .upsert({
              id: `braider_${userId}`,
              user_id: userId,
              full_name,
              email,
              phone,
              avatar_url: null,
              bio: bio || '',
              experience_years: years_experience || 0,
              specialization: specialization || '',
              services: services || [],
              rating_avg: 5.0,
              rating_count: 0,
              verification_status: 'pending',
              travel_radius_miles: 10,
              is_mobile: true,
              salon_address: address || null,
              specialties: specialization ? [specialization] : [],
              total_earnings: 0,
              available_balance: 0,
              state: state || null,
              city: city || null,
              address: address || null,
              verified: false,
              next_of_kin_name: next_of_kin_name || null,
              next_of_kin_phone: next_of_kin_phone || null,
              next_of_kin_relationship: next_of_kin_relationship || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
            })
          
          if (upsertError) {
            console.error('Braider profile upsert error:', upsertError)
          }
        }

        console.log(`=== SIGNUP: Braider profile created for user ${userId} ===`)
      } catch (err) {
        console.error('Braider profile creation error:', err)
      }
    }

    // 5. Create initial notification
    try {
      const { error: notificationError } = await serviceSupabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'welcome',
          title: 'Welcome to BraidMe',
          message: `Welcome ${full_name}! Your account has been created successfully.`,
          data: { role },
          is_read: false,
          created_at: new Date().toISOString(),
        })

      if (notificationError) {
        console.error('Notification error:', notificationError)
      }
    } catch (err) {
      console.error('Notification creation error:', err)
    }

    // 6. Return success with verified profile
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        full_name,
        role,
        phone,
        phone_country,
      },
      message: 'User created successfully with verified profile',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    console.error('Signup error:', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
