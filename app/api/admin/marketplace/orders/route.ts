import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('marketplace_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: ordersData, error: ordersError } = await query;

    if (ordersError) {
      return NextResponse.json({ success: false, error: ordersError.message }, { status: 500 });
    }

    if (!ordersData?.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Enrich with profiles
    const customerIds = [...new Set(ordersData.map(o => o.customer_id))];
    const braiderIds = [...new Set(ordersData.map(o => o.braider_id))];
    const allIds = [...new Set([...customerIds, ...braiderIds])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', allIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

    // Get order items
    const orderIds = ordersData.map(o => o.id);
    const { data: items } = await supabase
      .from('marketplace_order_items')
      .select('order_id, quantity, marketplace_products(name, image_url)')
      .in('order_id', orderIds);

    const itemMap: Record<string, any> = {};
    (items || []).forEach((item: any) => { itemMap[item.order_id] = item; });

    const enriched = ordersData.map(order => {
      const customer = profileMap[order.customer_id] || {};
      const braider = profileMap[order.braider_id] || {};
      const item = itemMap[order.id];
      return {
        ...order,
        customer_name: (customer as any).full_name || 'Customer',
        customer_email: (customer as any).email || '',
        braider_name: (braider as any).full_name || 'Braider',
        braider_email: (braider as any).email || '',
        product_name: item?.marketplace_products?.name || 'Product',
        product_image: item?.marketplace_products?.image_url || null,
        quantity: item?.quantity || 1,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Admin marketplace orders error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ success: false, error: 'order_id and status required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { error } = await supabase
      .from('marketplace_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order_id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('Admin marketplace order update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
