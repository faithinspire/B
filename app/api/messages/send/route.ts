import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Types
interface SendMessageRequest {
  conversation_id: string;
  sender_id: string;
  sender_role: 'customer' | 'braider' | 'admin';
  content: string;
  message_type: 'text' | 'location' | 'image' | 'system';
  metadata?: Record<string, any>;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  message_type: string;
  metadata: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export async function POST(request: Request) {
  try {
    const body: SendMessageRequest = await request.json();

    // Validate required fields
    if (!body.conversation_id || !body.sender_id || !body.sender_role || !body.content || !body.message_type) {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id, sender_id, sender_role, content, message_type' },
        { status: 400 }
      );
    }

    // Validate sender_role
    const validRoles = ['customer', 'braider', 'admin'];
    if (!validRoles.includes(body.sender_role)) {
      return NextResponse.json(
        { error: 'Invalid sender_role. Must be one of: customer, braider, admin' },
        { status: 400 }
      );
    }

    // Validate message_type
    const validMessageTypes = ['text', 'location', 'image', 'system'];
    if (!validMessageTypes.includes(body.message_type)) {
      return NextResponse.json(
        { error: 'Invalid message_type. Must be one of: text, location, image, system' },
        { status: 400 }
      );
    }

    // Validate content is not empty
    if (body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content cannot be empty' },
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

    // Verify conversation exists
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .select('id, customer_id, braider_id, admin_id')
      .eq('id', body.conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify sender is part of conversation
    const isPartOfConversation =
      body.sender_id === conversation.customer_id ||
      body.sender_id === conversation.braider_id ||
      (conversation.admin_id && body.sender_id === conversation.admin_id);

    if (!isPartOfConversation) {
      return NextResponse.json(
        { error: 'Sender is not part of this conversation' },
        { status: 403 }
      );
    }

    // Create message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const message: Message = {
      id: messageId,
      conversation_id: body.conversation_id,
      sender_id: body.sender_id,
      sender_role: body.sender_role,
      content: body.content,
      message_type: body.message_type,
      metadata: body.metadata || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await serviceSupabase
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json(
        { error: `Failed to create message: ${error.message}` },
        { status: 500 }
      );
    }

    // Log admin access if admin sends message
    if (body.sender_role === 'admin') {
      await serviceSupabase
        .from('admin_access_logs')
        .insert([
          {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            admin_id: body.sender_id,
            conversation_id: body.conversation_id,
            action: 'sent_message',
            timestamp: new Date().toISOString(),
          },
        ]);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Message send error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
