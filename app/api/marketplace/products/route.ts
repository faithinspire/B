import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const country_code = searchParams.get('country_code') || 'NG';
    const state = searchParams.get('state');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('marketplace_products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .eq('country_code', country_code)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (state) {
      query = query.eq('location_state', state);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const { data: products, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Products fetch error:', error);
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
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
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

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const body = await request.json();
    const {
      braider_id,
      name,
      description,
      category,
      price,
      currency,
      country_code,
      location_state,
      location_city,
      stock_quantity,
      image_url,
    } = body;

    if (!braider_id || !name || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('marketplace_products')
      .insert({
        braider_id,
        name,
        description,
        category: category || 'General',
        price,
        currency: currency || 'NGN',
        country_code: country_code || 'NG',
        location_state,
        location_city,
        stock_quantity: stock_quantity || 0,
        image_url,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Product creation error:', error);
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
