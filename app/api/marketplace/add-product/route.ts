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
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Insert product
    const { data, error } = await supabase
      .from('marketplace_products')
      .insert({
        braider_id: user.id,
        name,
        description: description || '',
        category,
        price: parseFloat(price),
        currency: currency || 'NGN',
        stock_quantity: parseInt(stock_quantity) || 0,
        image_url: image_url || '',
        is_active: true,
        status: 'active',
        country_code,
        location_state,
        location_city,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
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
      { success: false, error: 'Failed to add product' },
      { status: 500 }
    );
  }
}
