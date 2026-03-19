import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Types
interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  admin_id: string | null;
  status: 'active' | 'completed' | 'archived';
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

interface CreateConversationRequest {
  booking_id: string;
  customer_id: string;
  braider_id: string;
}

// GET /api/conversations - List conversations for current user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const role = searchParams.get('role') as 'customer' | 'braider' | 'admin' | null;
    const status = searchParams.get('status') as 'active' | 'completed' | 'archived' | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && !['customer', 'braider', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: customer, braider, admin' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['active', 'completed', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, completed, archived' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Build query
    let query = serviceSupabase
      .from('conversations')
      .select('*');

    // Filter by user role
    if (role === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (role === 'braider') {
      query = query.eq('braider_id', userId);
    } else if (role === 'admin') {
      query = query.eq('admin_id', userId);
    } else {
      // If no role specified, get conversations where user is customer, braider, or admin
      query = query.or(
        `customer_id.eq.${userId},braider_id.eq.${userId},admin_id.eq.${userId}`
      );
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Order by updated_at
    query = query.order('updated_at', { ascending: false });

    const { data: conversations, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { count } = await serviceSupabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        return {
          ...conv,
          unread_count: count || 0,
        };
      })
    );

    return NextResponse.json(conversationsWithUnread);
  } catch (error) {
    console.error('List conversations error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: Request) {
  try {
    const body: CreateConversationRequest = await request.json();

    // Validate required fields
    if (!body.booking_id || !body.customer_id || !body.braider_id) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, customer_id, braider_id' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Verify booking exists
    const { data: booking, error: bookingError } = await serviceSupabase
      .from('bookings')
      .select('id')
      .eq('id', body.booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if conversation already exists for this booking
    const { data: existingConv } = await serviceSupabase
      .from('conversations')
      .select('id')
      .eq('booking_id', body.booking_id)
      .single();

    if (existingConv) {
      return NextResponse.json(
        { error: 'Conversation already exists for this booking' },
        { status: 400 }
      );
    }

    // Create conversation
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    const conversation: Conversation = {
      id: conversationId,
      booking_id: body.booking_id,
      customer_id: body.customer_id,
      braider_id: body.braider_id,
      admin_id: null,
      status: 'active',
      started_at: now,
      ended_at: null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await serviceSupabase
      .from('conversations')
      .insert([conversation])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        { error: `Failed to create conversation: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create conversation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
