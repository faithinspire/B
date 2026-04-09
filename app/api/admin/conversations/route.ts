import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Fetch all conversations with related data
    const { data: conversations, error: convErr } = await supabase
      .from('conversations')
      .select(
        `
        id,
        booking_id,
        customer_id,
        braider_id,
        admin_id,
        status,
        started_at,
        ended_at,
        created_at,
        updated_at
      `
      )
      .order('updated_at', { ascending: false });

    if (convErr) {
      console.error('Conversations fetch error:', convErr);
      throw new Error(`Failed to fetch conversations: ${convErr.message}`);
    }

    // If no conversations, return empty array
    if (!conversations || conversations.length === 0) {
      return NextResponse.json([]);
    }

    // Enrich with user names and message counts
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        try {
          // Get customer name
          const { data: customer, error: custErr } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', conv.customer_id)
            .single();

          // Get braider name
          const { data: braider, error: braiderErr } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', conv.braider_id)
            .single();

          // Get message count
          const { count: messageCount, error: countErr } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          // Get last message
          const { data: lastMessage, error: msgErr } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            customer_name: customer?.full_name || 'Unknown',
            braider_name: braider?.full_name || 'Unknown',
            message_count: messageCount || 0,
            last_message: lastMessage?.content || null,
            last_message_time: lastMessage?.created_at || null,
          };
        } catch (err) {
          console.error(`Error enriching conversation ${conv.id}:`, err);
          return {
            ...conv,
            customer_name: 'Unknown',
            braider_name: 'Unknown',
            message_count: 0,
            last_message: null,
            last_message_time: null,
          };
        }
      })
    );

    return NextResponse.json(enrichedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
