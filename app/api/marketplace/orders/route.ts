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
    const coreInsert: any = {
      product_id,
      buyer_id,
      buyer_email: buyer_email || '',
      buyer_name: buyer_name || '',
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

    // Try with all new columns first
    const fullInsert = {
      ...coreInsert,
      braider_id: finalBraiderId,
      payment_method: finalPaymentMethod,
      seller_country: finalSellerCountry,
    };

    let order: any = null;
    let insertError: any = null;

    // Attempt 1: Full insert with new columns
    const result1 = await db.from('marketplace_orders').insert(fullInsert).select().single();
    if (!result1.error) {
      order = result1.data;
    } else {
      insertError = result1.error;
      console.error('Full insert failed:', result1.error.message);

      // Attempt 2: Try without braider_id/payment_method/seller_country
      const result2 = await db.from('marketplace_orders').insert(coreInsert).select().single();
      if (!result2.error) {
        order = result2.data;
        insertError = null;
      } else {
        insertError = result2.error;
        console.error('Core insert also failed:', result2.error.message);

        // Attempt 3: Try with buyer_id as customer_id alias (some schemas use customer_id)
        const altInsert = { ...coreInsert, customer_id: buyer_id };
        delete altInsert.buyer_id;
        const result3 = await db.from('marketplace_orders').insert(altInsert).select().single();
        if (!result3.error) {
          order = result3.data;
          insertError = null;
        } else {
          insertError = result3.error;
        }
      }
    }

    if (insertError || !order) {
      console.error('All insert attempts failed:', insertError?.message);
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create order' },
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
