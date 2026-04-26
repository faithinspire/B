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

    // Build the minimal insert that always works (only core columns)
    // Try customer_id first (some schemas), then buyer_id
    const baseFields: any = {
      product_id,
      seller_id,
      product_name: product_name || '',
      product_image: product_image || null,
      quantity: quantity || 1,
      unit_price: unit_price || 0,
      total_amount,
      currency: currency || 'NGN',
      delivery_address: delivery_address || '',
      notes: notes || null,
      status: 'pending',
      payment_status: 'unpaid',
    };

    let order: any = null;
    let lastError: any = null;

    // Try all column name combinations to handle different schema versions
    const insertVariants = [
      // Variant 1: customer_id (original schema)
      { ...baseFields, customer_id: buyer_id, buyer_email: buyer_email || '', buyer_name: buyer_name || '' },
      // Variant 2: buyer_id (new schema)
      { ...baseFields, buyer_id, buyer_email: buyer_email || '', buyer_name: buyer_name || '' },
      // Variant 3: customer_id with new columns
      { ...baseFields, customer_id: buyer_id, buyer_email: buyer_email || '', buyer_name: buyer_name || '', braider_id: finalBraiderId, payment_method: finalPaymentMethod, seller_country: finalSellerCountry },
      // Variant 4: buyer_id with new columns
      { ...baseFields, buyer_id, buyer_email: buyer_email || '', buyer_name: buyer_name || '', braider_id: finalBraiderId, payment_method: finalPaymentMethod, seller_country: finalSellerCountry },
      // Variant 5: minimal - just the absolute essentials
      { product_id, customer_id: buyer_id, seller_id, total_amount, currency: currency || 'NGN', status: 'pending', payment_status: 'unpaid' },
    ];

    for (const variant of insertVariants) {
      const result = await db.from('marketplace_orders').insert(variant).select().single();
      if (!result.error) {
        order = result.data;
        break;
      }
      lastError = result.error;
      console.log(`Insert variant failed: ${result.error.message}`);
    }

    if (!order) {
      console.error('All insert variants failed. Last error:', lastError?.message);
      return NextResponse.json(
        { error: `Order creation failed: ${lastError?.message || 'Unknown error'}` },
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
