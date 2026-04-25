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

    const { data: messages, error } = await db
      .from('marketplace_order_messages')
      .select('*')
      .eq('order_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: messages }, { status: 200 });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { sender_id, sender_role, content } = body;

    if (!sender_id || !content?.trim()) {
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

    // Verify sender is part of order
    if (sender_id !== order.buyer_id && sender_id !== order.seller_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Insert message
    const { data: message, error: insertError } = await db
      .from('marketplace_order_messages')
      .insert({
        order_id: params.id,
        sender_id,
        sender_role: sender_role || (sender_id === order.buyer_id ? 'customer' : 'seller'),
        content: content.trim(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
