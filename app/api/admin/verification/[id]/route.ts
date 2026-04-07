import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: No auth token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    let userRole = (user.user_metadata as any)?.role;

    if (!userRole || userRole !== 'admin') {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          userRole = profile.role;
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    }

    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { verification_status } = body;

    if (!verification_status || !['verified', 'rejected', 'pending'].includes(verification_status)) {
      return NextResponse.json(
        { error: 'Invalid verification_status' },
        { status: 400 }
      );
    }

    // Update braider verification status
    const { data, error } = await supabaseAdmin
      .from('braider_profiles')
      .update({ 
        verification_status, 
        verified: verification_status === 'verified',
        updated_at: new Date().toISOString() 
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Verification update error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, braider: data });
  } catch (error: any) {
    console.error('Verification update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update verification status' },
      { status: 500 }
    );
  }
}
