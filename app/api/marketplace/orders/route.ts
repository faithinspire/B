import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, buyer_id, quantity, delivery_address, notes } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Get product details
    const { data: product } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create order
    const { data: order, error } = await supabase
      .from('marketplace_orders')
      .insert({
        product_id,
        buyer_id,
        seller_id: product.braider_id,
        quantity: quantity || 1,
        total_amount: product.price * (quantity || 1),
        currency: product.currency || 'NGN',
        delivery_address,
        notes,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Table might not exist yet — return graceful error
      return NextResponse.json(
        { error: 'Order system not yet set up. Please contact seller directly.', details: error.message },
        { status: 500 }
      );
    }

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: product.braider_id,
      type: 'new_order',
      title: 'New Order Received!',
      message: `You have a new order for ${product.name}`,
      data: { order_id: order.id, product_id },
      is_read: false,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role'); // 'buyer' or 'seller'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    let query = supabase
      .from('marketplace_orders')
      .select('*, marketplace_products(name, image_url, price)');

    if (role === 'seller') {
      query = query.eq('seller_id', user_id);
    } else {
      query = query.eq('buyer_id', user_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return NextResponse.json({ orders: [] });
    return NextResponse.json({ orders: data || [] });
  } catch (error: any) {
    return NextResponse.json({ orders: [] });
  }
}
