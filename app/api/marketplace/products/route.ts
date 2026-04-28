import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Server configuration error', data: [] }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const country_code = searchParams.get('country_code');
    const state = searchParams.get('state');
    const braider_id = searchParams.get('braider_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Start with base query — ONLY show active products
    let query = supabase
      .from('marketplace_products')
      .select('*', { count: 'exact' })
      .eq('is_active', true) // CRITICAL: Only show active products
      .order('created_at', { ascending: false });

    if (country_code && country_code !== '') {
      query = query.eq('country_code', country_code);
    }
    if (braider_id && braider_id !== '') {
      query = query.eq('braider_id', braider_id);
    }
    if (category && category !== '') {
      query = query.eq('category', category);
    }
    if (state && state !== '') {
      query = query.eq('location_state', state);
    }
    if (search && search !== '') {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Products fetch error:', error.message);
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error('Marketplace products API error:', err);
    return NextResponse.json({ success: false, error: 'Server error', data: [] }, { status: 500 });
  }
}
