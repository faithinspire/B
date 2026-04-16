import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('marketplace_products')
      .select(`
        id,
        braider_id,
        category_id,
        name,
        description,
        price,
        currency,
        images,
        video_url,
        location_country,
        location_state,
        location_city,
        is_featured,
        rating_avg,
        rating_count,
        view_count,
        status,
        created_at,
        updated_at
      `)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }

    if (state) {
      query = query.ilike('location_state', `%${state}%`);
    }

    if (city) {
      query = query.ilike('location_city', `%${city}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Get total count
    const { count: total } = await query;

    // Apply pagination
    const { data: products, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: products || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (err) {
    console.error('Marketplace products API error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const body = await request.json();
    const {
      braider_id,
      category_id,
      name,
      description,
      price,
      currency,
      images,
      video_url,
      location_state,
      location_city,
      quantity_available,
    } = body;

    if (!braider_id || !category_id || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('marketplace_products')
      .insert({
        braider_id,
        category_id,
        name,
        description,
        price,
        currency: currency || 'NGN',
        images: images || [],
        video_url,
        location_country: 'NG',
        location_state,
        location_city,
        quantity_available: quantity_available || 0,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (err) {
    console.error('Create product error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
