import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const body = await request.json();
    const {
      customer_id,
      braider_id,
      items, // Array of { product_id, quantity }
      total_amount,
      currency,
      shipping_address,
      shipping_method,
      payment_method,
    } = body;

    // Validate required fields
    if (!customer_id || !braider_id || !items || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert({
        order_number: orderNumber,
        customer_id,
        braider_id,
        total_amount,
        currency: currency || 'NGN',
        status: 'pending',
        shipping_address,
        shipping_method,
        payment_method: payment_method || 'stripe',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('marketplace_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      );
    }

    // Update product stock
    for (const item of items) {
      await supabase
        .from('marketplace_products')
        .update({
          stock_quantity: supabase.rpc('decrement_stock', {
            product_id: item.product_id,
            quantity: item.quantity,
          }),
        })
        .eq('id', item.product_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        order,
        items: orderItems,
      },
    });
  } catch (err) {
    console.error('Create order error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
