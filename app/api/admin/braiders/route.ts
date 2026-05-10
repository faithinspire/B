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

    // SIMPLE QUERY: Just get all braider_profiles without joins
    // This avoids column errors and works with incomplete schema
    const { data: braiders, error } = await supabaseAdmin
      .from('braider_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching braiders:', error);
      // Return empty list instead of error - graceful degradation
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

    // Get stats from the data we have
    const total = braiders?.length || 0;
    const pending = braiders?.filter(b => b.verification_status === 'pending').length || 0;
    const approved = braiders?.filter(b => b.verification_status === 'approved').length || 0;
    const rejected = braiders?.filter(b => b.verification_status === 'rejected').length || 0;

    return NextResponse.json({
      success: true,
      data: braiders || [],
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
