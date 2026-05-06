import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversation_id, sender_id, sender_role, content } = body;

    // Validate required fields
    if (!conversation_id || !sender_id || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id, sender_id, content' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Get conversation to verify it exists and get participants
    const { data: conversation, error: convError } = await db
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError?.message);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Determine receiver based on sender role
    let receiver_id: string | null = null;
    let resolved_sender_role = sender_role || 'customer';

    if (sender_role === 'customer') {
      receiver_id = conversation.braider_id;
      resolved_sender_role = 'customer';
    } else if (sender_role === 'braider') {
      receiver_id = conversation.customer_id;
      resolved_sender_role = 'braider';
    } else if (sender_role === 'admin') {
      // For admin, send to both
      receiver_id = conversation.customer_id === sender_id ? conversation.braider_id : conversation.customer_id;
      resolved_sender_role = 'admin';
    }

    // Verify sender is part of conversation
    const isValidSender = 
      sender_id === conversation.customer_id ||
      sender_id === conversation.braider_id ||
      sender_id === conversation.admin_id ||
      sender_role === 'admin';

    if (!isValidSender) {
      console.error('Sender not authorized for this conversation');
      return NextResponse.json(
        { error: 'Sender not authorized for this conversation' },
        { status: 403 }
      );
    }

    // Insert message with all required fields
    // Try with 'read' column first (new schema), fallback to 'is_read' (old schema)
    let insertError: any = null;
    let message: any = null;

    const messageData = {
      conversation_id,
      sender_id,
      sender_role: resolved_sender_role,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    // Try new schema with 'read' column
    const { data: newMsg, error: newErr } = await db
      .from('messages')
      .insert({ ...messageData, read: false })
      .select()
      .single();

    if (!newErr && newMsg) {
      message = newMsg;
    } else {
      // Fallback: try old schema with 'is_read' column
      const { data: oldMsg, error: oldErr } = await db
        .from('messages')
        .insert({ ...messageData, is_read: false })
        .select()
        .single();

      if (!oldErr && oldMsg) {
        message = oldMsg;
      } else {
        // Last resort: insert without read/is_read
        const { data: bareMsg, error: bareErr } = await db
          .from('messages')
          .insert(messageData)
          .select()
          .single();

        if (!bareErr && bareMsg) {
          message = bareMsg;
        } else {
          insertError = bareErr || oldErr || newErr;
        }
      }
    }

    if (insertError) {
      console.error('Message insert error:', insertError.message);
      return NextResponse.json(
        { error: `Failed to send message: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Send notification to receiver
    if (receiver_id && receiver_id !== sender_id) {
      try {
        const notifContent = content.length > 60 ? content.slice(0, 60) + '...' : content;
        await db.from('notifications').insert({
          user_id: receiver_id,
          type: 'message',
          title: 'New Message',
          message: notifContent,
          read: false,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Notification send error:', err);
        // Don't fail the message send if notification fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          ...message,
          conversation_id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
