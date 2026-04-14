import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Ensure Profile Endpoint
 * 
 * This endpoint is called immediately after signup to ensure the profile is created
 * with the correct role. This handles the case where the profile table hasn't replicated yet.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, fullName, role } = body;

    if (!userId || !email || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Profile fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check profile' },
        { status: 400 }
      );
    }

    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log(`Creating profile for user ${userId} with role ${role}`);
      
      const { error: createError } = await serviceSupabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        console.error('Profile creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        message: `Profile created with role ${role}`,
      });
    }

    // If profile exists but role is wrong, update it
    if (existingProfile.role !== role) {
      console.log(`Updating profile role from ${existingProfile.role} to ${role}`);
      
      const { error: updateError } = await serviceSupabase
        .from('profiles')
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'updated',
        message: `Profile role updated to ${role}`,
      });
    }

    // Profile exists with correct role
    return NextResponse.json({
      success: true,
      action: 'verified',
      message: `Profile already exists with correct role ${role}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Ensure profile error:', message);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
