import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders
 * Fetch all marketplace orders with stats
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Fetch all orders
    const { data: orders, error: ordersError } = await supabase
      .from('marketplace_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Orders fetch error:', ordersError);
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    // Get customer and braider names
    const customerIds = [...new Set((orders || []).map(o => o.customer_id))];
    const braiderIds = [...new Set((orders || []).map(o => o.braider_id))];

    let customersMap: Record<string, string> = {};
    let braidersMap: Record<string, string> = {};

    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);
      
      if (customers) {
        customersMap = Object.fromEntries(customers.map(c => [c.id, c.full_name]));
      }
    }

    if (braiderIds.length > 0) {
      const { data: braiders } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', braiderIds);
      
      if (braiders) {
        braidersMap = Object.fromEntries(braiders.map(b => [b.id, b.full_name]));
      }
    }

    // Get product names
    const productIds = [...new Set((orders || []).map(o => o.product_id))];
    let productsMap: Record<string, string> = {};

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('id, name')
        .in('id', productIds);
      
      if (products) {
        productsMap = Object.fromEntries(products.map(p => [p.id, p.name]));
      }
    }

    // Enrich orders with names
    const enrichedOrders = (orders || []).map(order => ({
      ...order,
      customer_name: customersMap[order.customer_id] || 'Unknown',
      braider_name: braidersMap[order.braider_id] || 'Unknown',
      product_name: productsMap[order.product_id] || 'Unknown Product',
    }));

    // Calculate stats
    const stats = {
      total: enrichedOrders.length,
      pending: enrichedOrders.filter(o => o.status === 'pending').length,
      processing: enrichedOrders.filter(o => o.status === 'processing').length,
      shipped: enrichedOrders.filter(o => o.status === 'shipped').length,
      delivered: enrichedOrders.filter(o => o.status === 'delivered').length,
      cancelled: enrichedOrders.filter(o => o.status === 'cancelled').length,
    };

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      stats,
    });
  } catch (error) {
    console.error('Admin orders API error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
