import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: order, error } = await db
      .from('marketplace_orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: order }, { status: 200 });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, tracking_info, dispatch_notes, payment_status, paystack_reference, stripe_payment_intent_id } = body;

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Verify order exists
    const { data: order, error: orderError } = await db
      .from('marketplace_orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (tracking_info) updateData.tracking_info = tracking_info;
    if (dispatch_notes) updateData.dispatch_notes = dispatch_notes;
    if (payment_status) updateData.payment_status = payment_status;
    if (paystack_reference) updateData.paystack_reference = paystack_reference;
    if (stripe_payment_intent_id) updateData.stripe_payment_intent_id = stripe_payment_intent_id;

    const { data: updatedOrder, error: updateError } = await db
      .from('marketplace_orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: updatedOrder }, { status: 200 });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
