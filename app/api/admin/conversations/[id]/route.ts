import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Fetch messages for this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Messages fetch error:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Fetch sender names
    const senderIds = [...new Set((messages || []).map(m => m.sender_id))];
    let sendersMap: Record<string, string> = {};

    if (senderIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      if (profiles) {
        sendersMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
      }
    }

    // Transform messages with sender names
    const transformedMessages = (messages || []).map(m => ({
      ...m,
      sender_name: sendersMap[m.sender_id] || 'Unknown',
    }));

    return NextResponse.json({ messages: transformedMessages });
  } catch (error: any) {
    console.error('Get conversation messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
