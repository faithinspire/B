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
    const product_id = searchParams.get('product_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('[marketplace-products] Fetching products with filters:', {
      category, search, country_code, state, braider_id, product_id, page, limit
    });

    // If fetching a specific product, don't filter by is_active (allow braiders to see their own products)
    let query = supabase
      .from('marketplace_products')
      .select('*', { count: 'exact' });

    // Only filter by is_active if NOT fetching a specific product
    if (!product_id) {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    // Apply filters
    if (product_id && product_id !== '') {
      query = query.eq('id', product_id);
    }
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

    // Apply pagination
    let { data: products, count, error } = await query.range(offset, offset + limit - 1);

    // If query failed, log and return empty gracefully
    if (error) {
      console.error('[marketplace-products] Query error:', error.message);
      // Try without filters to diagnose
      const { data: allProducts, error: allError } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .limit(5);
      
      if (allError) {
        console.error('[marketplace-products] Even basic query failed:', allError.message);
        return NextResponse.json({ 
          success: false, 
          error: `Database error: ${allError.message}`, 
          data: [] 
        }, { status: 500 });
      }
      
      console.log('[marketplace-products] Basic query succeeded, found', allProducts?.length, 'products');
      return NextResponse.json({
        success: true,
        data: allProducts || [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      });
    }

    console.log('[marketplace-products] ✅ Found', products?.length || 0, 'products, total count:', count);

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
    console.error('[marketplace-products] Fatal error:', err);
    return NextResponse.json({ success: false, error: 'Server error: ' + err.message, data: [] }, { status: 500 });
  }
}
