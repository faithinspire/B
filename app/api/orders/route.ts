import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Get orders for a customer or braider
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const braiderId = searchParams.get('braider_id');
    const orderId = searchParams.get('id');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Get single order by ID
    if (orderId) {
      const { data: order, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          product:marketplace_products(name, images),
          customer:profiles!marketplace_orders_customer_id_fkey(full_name, avatar_url),
          braider:profiles!marketplace_orders_braider_id_fkey(full_name, avatar_url)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        order: {
          ...order,
          product_name: order.product?.name || 'Unknown Product',
          product_image: order.product?.images?.[0],
          customer_name: order.customer?.full_name,
          braider_name: order.braider?.full_name,
          braider_avatar: order.braider?.avatar_url,
        },
      });
    }

    // Build query
    let query = supabase
      .from('marketplace_orders')
      .select(`
        *,
        product:marketplace_products(name, images),
        customer:profiles!marketplace_orders_customer_id_fkey(full_name, avatar_url),
        braider:profiles!marketplace_orders_braider_id_fkey(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    // Filter by customer
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    // Filter by braider
    if (braiderId) {
      query = query.eq('braider_id', braiderId);
    }

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform orders
    const transformedOrders = (orders || []).map(order => ({
      ...order,
      product_name: order.product?.name || 'Unknown Product',
      product_image: order.product?.images?.[0],
      customer_name: order.customer?.full_name,
      braider_name: order.braider?.full_name,
      braider_avatar: order.braider?.avatar_url,
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      customer_id,
      braider_id,
      quantity = 1,
      total_amount,
      shipping_address,
      country_code = 'NG',
    } = body;

    if (!product_id || !customer_id || !braider_id || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate fees (10% platform fee)
    const platformFee = total_amount * 0.1;
    const sellerPayout = total_amount - platformFee;

    const { data: order, error } = await supabase
      .from('marketplace_orders')
      .insert({
        order_number: orderNumber,
        product_id,
        customer_id,
        braider_id,
        quantity,
        total_amount,
        platform_fee: platformFee,
        seller_payout: sellerPayout,
        shipping_address,
        country_code,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Create order error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
