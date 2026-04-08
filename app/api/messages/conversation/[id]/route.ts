import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Fetch all messages for this conversation
    const { data: messages, error: messagesError } = await db
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Messages fetch error:', messagesError.message);
      return NextResponse.json(
        { error: `Failed to fetch messages: ${messagesError.message}` },
        { status: 500 }
      );
    }

    // Normalize messages to ensure consistent format
    const normalizedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      sender_role: msg.sender_role || 'customer',
      content: msg.content,
      is_read: msg.is_read || msg.read || false,
      created_at: msg.created_at || msg.timestamp,
      updated_at: msg.updated_at,
    }));

    return NextResponse.json({
      success: true,
      messages: normalizedMessages,
      count: normalizedMessages.length,
    });
  } catch (error: any) {
    console.error('Conversation messages error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const body = await request.json();
    const { message_ids } = body;

    if (!conversationId || !message_ids || !Array.isArray(message_ids)) {
      return NextResponse.json(
        { error: 'Conversation ID and message_ids array are required' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Mark messages as read - try 'read' column first, fallback to 'is_read'
    const { error: updateError } = await db
      .from('messages')
      .update({ read: true })
      .in('id', message_ids);

    if (updateError) {
      // Fallback: try is_read column
      const { error: updateError2 } = await db
        .from('messages')
        .update({ is_read: true })
        .in('id', message_ids);

      if (updateError2) {
        console.error('Mark as read error:', updateError2.message);
        return NextResponse.json(
          { error: `Failed to mark messages as read: ${updateError2.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
