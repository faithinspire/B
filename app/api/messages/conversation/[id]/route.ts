import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Get conversation
    const { data: conversation, error: convError } = await db
      .from('conversations').select('*').eq('id', params.id).single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const customer_id = conversation.customer_id || conversation.participant1_id;
    const braider_id = conversation.braider_id || conversation.participant2_id;

    // Verify user is part of conversation
    const isPartOf = userId === customer_id || userId === braider_id || userId === conversation.admin_id;
    if (!isPartOf) {
      return NextResponse.json({ error: 'Not part of this conversation' }, { status: 403 });
    }

    let messages: any[] = [];

    // Try new schema: conversation_id column
    const { data: newMsgs, error: newErr } = await db
      .from('messages').select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (!newErr && newMsgs && newMsgs.length > 0) {
      messages = newMsgs;
    } else {
      // Fallback: old schema — get messages between the two participants
      const { data: oldMsgs } = await db
        .from('messages').select('*')
        .or(`and(sender_id.eq.${customer_id},receiver_id.eq.${braider_id}),and(sender_id.eq.${braider_id},receiver_id.eq.${customer_id})`)
        .order('created_at', { ascending: true })
        .limit(limit);
      if (oldMsgs) messages = oldMsgs;
    }

    // Normalize messages to consistent format
    const normalized = messages.map((msg: any) => ({
      id: msg.id,
      conversation_id: msg.conversation_id || params.id,
      sender_id: msg.sender_id,
      sender_role: msg.sender_role || (msg.sender_id === customer_id ? 'customer' : msg.sender_id === braider_id ? 'braider' : 'admin'),
      content: msg.content,
      message_type: msg.message_type || 'text',
      read: msg.read || false,
      created_at: msg.created_at || msg.timestamp,
    }));

    return NextResponse.json({ messages: normalized });
  } catch (error) {
    console.error('Message retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}
