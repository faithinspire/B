import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role'); // 'buyer' or 'seller'

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'Missing user_id or role' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    let query = db.from('marketplace_orders').select('*');

    if (role === 'buyer') {
      query = query.eq('buyer_id', user_id);
    } else if (role === 'seller') {
      query = query.eq('seller_id', user_id);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: orders }, { status: 200 });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      product_id,
      buyer_id,
      buyer_email,
      buyer_name,
      seller_id,
      braider_id,
      product_name,
      product_image,
      quantity,
      unit_price,
      total_amount,
      currency,
      delivery_address,
      notes,
      seller_country,
      payment_method,
    } = body;

    if (!product_id || !buyer_id || !seller_id || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Use braider_id if provided, otherwise use seller_id
    const finalBraiderId = braider_id || seller_id;
    
    // Determine payment method based on seller country
    let finalPaymentMethod = payment_method || 'stripe';
    let finalSellerCountry = seller_country || 'NG';
    
    if (finalSellerCountry === 'NG') {
      finalPaymentMethod = 'paystack';
    } else if (finalSellerCountry === 'US') {
      finalPaymentMethod = 'stripe';
    }

    // First check which columns exist to handle missing migration gracefully
    const { data: columnCheck } = await db
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'marketplace_orders')
      .in('column_name', ['braider_id', 'payment_method', 'seller_country']);

    const existingCols = new Set((columnCheck || []).map((c: any) => c.column_name));

    // Build insert object based on what columns exist
    const insertData: any = {
      product_id,
      buyer_id,
      buyer_email,
      buyer_name,
      seller_id,
      product_name,
      product_image,
      quantity: quantity || 1,
      unit_price: unit_price || 0,
      total_amount,
      currency: currency || 'NGN',
      delivery_address,
      notes,
      status: 'pending',
      payment_status: 'unpaid',
    };

    // Only add columns that exist in the database
    if (existingCols.has('braider_id')) insertData.braider_id = finalBraiderId;
    if (existingCols.has('payment_method')) insertData.payment_method = finalPaymentMethod;
    if (existingCols.has('seller_country')) insertData.seller_country = finalSellerCountry;

    const { data: order, error } = await db
      .from('marketplace_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Marketplace order insert error:', error);
      // If still failing due to braider_id, try without it
      if (error.message?.includes('braider_id') || error.message?.includes('schema cache')) {
        delete insertData.braider_id;
        delete insertData.payment_method;
        delete insertData.seller_country;
        const { data: order2, error: error2 } = await db
          .from('marketplace_orders')
          .insert(insertData)
          .select()
          .single();
        if (error2) {
          return NextResponse.json({ error: error2.message }, { status: 400 });
        }
        return NextResponse.json({ data: order2 }, { status: 201 });
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
