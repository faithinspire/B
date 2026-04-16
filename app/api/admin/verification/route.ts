import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * HARD FIX: Admin verification API
 * Returns braiders with correct schema
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Query braider_profiles with COMPLETE schema
    let query = supabase
      .from('braider_profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        phone,
        bio,
        specialization,
        verification_status,
        state,
        city,
        address,
        id_type,
        id_number,
        id_document_url,
        next_of_kin_name,
        next_of_kin_phone,
        next_of_kin_relationship,
        experience_years,
        services,
        avatar_url,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }

    const { data: braiders, error: braiderError } = await query;

    if (braiderError) {
      return NextResponse.json(
        { success: false, error: braiderError.message },
        { status: 500 }
      );
    }

    // Get stats
    const { count: pending } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    const { count: approved } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'approved');

    const { count: rejected } = await supabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'rejected');

    return NextResponse.json({
      success: true,
      data: braiders || [],
      stats: {
        pending: pending || 0,
        approved: approved || 0,
        rejected: rejected || 0,
        total: (pending || 0) + (approved || 0) + (rejected || 0),
      },
    });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
