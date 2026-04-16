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
    const userId = searchParams.get('userId');
    const role = searchParams.get('role'); // 'customer' or 'braider'
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('marketplace_orders')
      .select('*, marketplace_order_items(*)', { count: 'exact' });

    // Filter by role
    if (role === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (role === 'braider') {
      query = query.eq('braider_id', userId);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const { data: orders, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('Orders API error:', err);
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
      customer_id,
      items, // Array of { product_id, quantity }
      shipping_address,
      shipping_method,
      notes,
    } = body;

    if (!customer_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total and get product details
    let totalAmount = 0;
    let braider_id = null;
    const orderItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.product_id} not found` },
          { status: 404 }
        );
      }

      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      braider_id = product.braider_id;
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal,
      });
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
        total_amount: totalAmount,
        status: 'pending',
        shipping_address,
        shipping_method,
        notes,
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
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('marketplace_order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      );
    }

    // Update stock quantities
    for (const item of items) {
      const { data: product } = await supabase
        .from('marketplace_products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('marketplace_products')
          .update({
            stock_quantity: product.stock_quantity - item.quantity,
          })
          .eq('id', item.product_id);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        items: orderItems,
      },
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
