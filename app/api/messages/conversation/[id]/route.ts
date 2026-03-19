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
        .order('timestamp', { ascending: true })
        .limit(limit);
      if (oldMsgs) messages = oldMsgs;
    }

    // Normalize messages
    const normalized = messages.map(m => ({
      ...m,
      conversation_id: m.conversation_id || params.id,
      created_at: m.created_at || m.timestamp || new Date().toISOString(),
      read: m.read ?? m.is_read ?? false,
    }));

    // Mark unread messages as read (best-effort)
    const unread = normalized.filter(m => !m.read && m.sender_id !== userId);
    if (unread.length > 0) {
      const ids = unread.map(m => m.id);
      // Try read column
      await db.from('messages').update({ read: true }).in('id', ids).catch(() => {
        db.from('messages').update({ is_read: true }).in('id', ids).catch(() => {});
      });
    }

    return NextResponse.json({ messages: normalized, total: normalized.length });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
