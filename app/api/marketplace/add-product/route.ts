import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      description,
      category,
      price,
      currency,
      stock_quantity,
      image_url,
      country_code,
      location_state,
      location_city,
    } = body;

    // Validate required fields
    if (!name || !category || !price || !country_code || !location_state || !location_city) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, category, price, country_code, location_state, location_city' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated - missing authorization header' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Insert product
    const { data, error } = await supabase
      .from('marketplace_products')
      .insert({
        braider_id: user.id,
        name: name.trim(),
        description: (description || '').trim(),
        category: category.trim(),
        price: parseFloat(price),
        currency: currency || 'NGN',
        stock_quantity: parseInt(stock_quantity) || 0,
        image_url: image_url || null,
        is_active: true,
        status: 'active',
        country_code,
        location_state: location_state.trim(),
        location_city: location_city.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
