import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, action } = body; // action: 'accept' | 'reject'

    if (!order_id || !action) {
      return NextResponse.json({ success: false, error: 'order_id and action required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // Verify seller
    const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Verify this order belongs to this seller
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('id', order_id)
      .eq('braider_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found or unauthorized' }, { status: 404 });
    }

    const newStatus = action === 'accept' ? 'confirmed' : action === 'deliver' ? 'delivered' : 'cancelled';

    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', order_id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Order accepted successfully' : 'Order rejected',
      status: newStatus,
    });
  } catch (error) {
    console.error('Order accept error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
