import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Get barbers from braider_profiles - filter by profession_type = 'barber'
    const { data: barbers, error } = await supabaseAdmin
      .from('braider_profiles')
      .select('id, user_id, full_name, email, phone, specialization, verification_status, state, city, bio, avatar_url, experience_years, rating_avg, rating_count, profession_type, created_at')
      .eq('profession_type', 'barber')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Barbers query error:', error);
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
    const barberList = Array.isArray(barbers) ? barbers : [];

    // Get stats from the data we have
    const total = barberList.length;
    const pending = barberList.filter(b => b.verification_status === 'pending').length;
    const approved = barberList.filter(b => b.verification_status === 'approved').length;
    const rejected = barberList.filter(b => b.verification_status === 'rejected').length;

    return NextResponse.json({
      success: true,
      data: barberList,
      stats: {
        total,
        pending,
        approved,
        rejected,
      },
    });
  } catch (err) {
    console.error('Barbers API error:', err);
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
