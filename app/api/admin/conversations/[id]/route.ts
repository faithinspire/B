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
      return NextResponse.json({ messages: [] });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Fetch messages - try both possible column names
    let messages: any[] = [];
    
    // Try with conversation_id first
    const { data: msgData1, error: err1 } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!err1 && msgData1) {
      messages = msgData1;
    } else {
      console.warn('conversation_id query failed, trying alternative...');
      // Fallback - return empty
      messages = [];
    }

    // Get sender names
    const senderIds = [...new Set((messages || []).map((m: any) => m.sender_id))];
    let sendersMap: Record<string, string> = {};

    if (senderIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      if (profiles) {
        sendersMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.full_name]));
      }
    }

    const transformed = (messages || []).map((m: any) => ({
      ...m,
      sender_name: sendersMap[m.sender_id] || 'Unknown',
    }));

    return NextResponse.json({ messages: transformed });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ messages: [] });
  }
}
