import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Types
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  message_type: string;
  metadata: Record<string, any> | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

interface PaginatedResponse {
  messages: Message[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const userId = searchParams.get('user_id');

    // Validate parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Page must be a valid number >= 1' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be a valid number between 1 and 100' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
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

    // Verify conversation exists and user is part of it
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .select('id, customer_id, braider_id, admin_id')
      .eq('id', params.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is part of conversation
    const isPartOfConversation =
      userId === conversation.customer_id ||
      userId === conversation.braider_id ||
      (conversation.admin_id && userId === conversation.admin_id);

    if (!isPartOfConversation) {
      return NextResponse.json(
        { error: 'You are not part of this conversation' },
        { status: 403 }
      );
    }

    // Get total count
    const { count, error: countError } = await serviceSupabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', params.id);

    if (countError) {
      console.error('Error counting messages:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    const total = count || 0;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch messages
    const { data: messages, error: messagesError } = await serviceSupabase
      .from('messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Mark messages as read for current user
    const unreadMessages = (messages || []).filter(
      (msg) => !msg.read && msg.sender_id !== userId
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg.id);
      await serviceSupabase
        .from('messages')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .in('id', messageIds);
    }

    const response: PaginatedResponse = {
      messages: (messages || []).reverse(), // Reverse to show oldest first
      page,
      limit,
      total,
      hasMore: offset + limit < total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Fetch messages error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch messages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
