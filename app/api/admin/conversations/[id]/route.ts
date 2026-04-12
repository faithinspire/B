import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    console.log(`Fetching messages for conversation: ${conversationId}`);
    
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
      console.error(`Messages fetch error for ${conversationId}:`, messagesError);
      return NextResponse.json(
        { error: `Failed to fetch messages: ${messagesError.message}` },
        { status: 500 }
      );
    }

    console.log(`Fetched ${messages?.length || 0} messages for conversation ${conversationId}`);

    // Fetch sender names
    const senderIds = [...new Set((messages || []).map(m => m.sender_id))];
    let sendersMap: Record<string, string> = {};

    if (senderIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      if (profilesError) {
        console.warn(`Profiles fetch error:`, profilesError);
      }

      if (profiles) {
        sendersMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
      }
    }

    // Transform messages with sender names
    const transformedMessages = (messages || []).map(m => ({
      ...m,
      sender_name: sendersMap[m.sender_id] || 'Unknown',
    }));

    console.log('Messages transformed successfully');
    return NextResponse.json({ messages: transformedMessages });
  } catch (error: any) {
    console.error('Get conversation messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
