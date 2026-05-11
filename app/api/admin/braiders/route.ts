import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Try to get braider_profiles - this is the source of truth for braiders
    const { data: braiders, error } = await supabaseAdmin
      .from('braider_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Braiders query error:', error);
      // Return empty list on error
      return NextResponse.json({
        success: true,
        data: [],
        stats: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      });
    }

    // Ensure we have an array
    const braiderList = Array.isArray(braiders) ? braiders : [];

    // Get stats from the data we have
    const total = braiderList.length;
    const pending = braiderList.filter(b => b.verification_status === 'pending').length;
    const approved = braiderList.filter(b => b.verification_status === 'approved').length;
    const rejected = braiderList.filter(b => b.verification_status === 'rejected').length;

    return NextResponse.json({
      success: true,
      data: braiderList,
      stats: {
        total,
        pending,
        approved,
        rejected,
      },
    });
  } catch (err) {
    console.error('Braiders API error:', err);
    // Return empty list on error - graceful degradation
    return NextResponse.json({
      success: true,
      data: [],
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    });
  }
}

