import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/orders/[id]/status
 * Update order status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Update order status
    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order status update error:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // If delivered, update payment status to paid (for pay on delivery)
    if (status === 'delivered') {
      await supabase
        .from('marketplace_orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId);
    }

    // If cancelled, handle refund logic
    if (status === 'cancelled') {
      // Get order details
      const { data: order } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (order && order.payment_status === 'paid') {
        // Mark for refund processing
        await supabase
          .from('marketplace_orders')
          .update({ payment_status: 'refunded' })
          .eq('id', orderId);

        // TODO: Process actual refund via payment provider
      }
    }

    // Send notification to customer
    const { data: order } = await supabase
      .from('marketplace_orders')
      .select('customer_id, order_number')
      .eq('id', orderId)
      .single();

    if (order) {
      await supabase
        .from('notifications')
        .insert({
          user_id: order.customer_id,
          type: 'order',
          title: 'Order Status Updated',
          message: `Your order #${order.order_number} is now ${status}`,
          data: { orderId, status },
        });
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
