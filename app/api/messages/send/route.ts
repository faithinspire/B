import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversation_id, sender_id, sender_role, content, message_type, metadata } = body;

    if (!conversation_id || !sender_id || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Verify conversation exists
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .select('id, customer_id, braider_id, admin_id')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify sender is part of conversation (admin always allowed)
    const isPartOf =
      sender_id === conversation.customer_id ||
      sender_id === conversation.braider_id ||
      (conversation.admin_id && sender_id === conversation.admin_id) ||
      sender_role === 'admin';

    if (!isPartOf) {
      return NextResponse.json({ error: 'Sender is not part of this conversation' }, { status: 403 });
    }

    // Try full insert first (with all columns), fall back to minimal if columns missing
    let data: any = null;
    let insertError: any = null;

    // Attempt 1: full schema
    const fullRecord: any = {
      conversation_id,
      sender_id,
      content: content.trim(),
    };
    // Only add optional columns if they exist — we'll detect via error
    fullRecord.sender_role = sender_role || 'customer';
    fullRecord.message_type = message_type || 'text';
    fullRecord.metadata = metadata || null;
    fullRecord.read = false;

    const res1 = await serviceSupabase.from('messages').insert([fullRecord]).select().single();
    if (!res1.error) {
      data = res1.data;
    } else {
      insertError = res1.error;
      // Attempt 2: minimal schema (only core columns that definitely exist)
      const minRecord: any = {
        conversation_id,
        sender_id,
        content: content.trim(),
      };
      // Try adding is_read (old schema)
      if (insertError.message?.includes('read')) {
        minRecord.is_read = false;
      }
      const res2 = await serviceSupabase.from('messages').insert([minRecord]).select().single();
      if (!res2.error) {
        data = res2.data;
        insertError = null;
      } else {
        // Attempt 3: absolute minimum
        const res3 = await serviceSupabase
          .from('messages')
          .insert([{ conversation_id, sender_id, content: content.trim() }])
          .select()
          .single();
        if (!res3.error) {
          data = res3.data;
          insertError = null;
        } else {
          insertError = res3.error;
        }
      }
    }

    if (insertError || !data) {
      console.error('Error creating message:', insertError);
      return NextResponse.json(
        { error: `Failed to create message: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // Notify recipient (best-effort)
    try {
      const recipientId =
        sender_role === 'customer' ? conversation.braider_id :
        sender_role === 'braider' ? conversation.customer_id :
        conversation.customer_id;
      if (recipientId && recipientId !== sender_id) {
        await serviceSupabase.from('notifications').insert({
          user_id: recipientId,
          type: 'message',
          title: 'New Message',
          message: content.length > 60 ? content.slice(0, 60) + '...' : content,
          read: false,
        }).catch(() => {
          // try is_read fallback
          serviceSupabase.from('notifications').insert({
            user_id: recipientId,
            type: 'message',
            title: 'New Message',
            message: content.length > 60 ? content.slice(0, 60) + '...' : content,
            is_read: false,
          }).catch(() => {});
        });
      }
    } catch {}

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
