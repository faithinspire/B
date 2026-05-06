import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const braiderIdsParam = searchParams.get('braider_ids');

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    let query = serviceSupabase.from('services').select('*');

    // Filter by braider IDs if provided
    if (braiderIdsParam) {
      const braiderIds = braiderIdsParam.split(',').filter(id => id.trim());
      if (braiderIds.length > 0) {
        query = query.in('braider_id', braiderIds);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Services API error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
