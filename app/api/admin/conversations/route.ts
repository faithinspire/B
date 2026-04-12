import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    console.log('Fetching conversations...');
    
    // Fetch conversations - use actual schema columns
    const { data: conversations, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (convErr) {
      console.error('Conversations error:', convErr);
      return NextResponse.json([]);
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json([]);
    }

    // Enrich with user names
    const enriched = await Promise.all(
      conversations.map(async (conv: any) => {
        try {
          const p1Id = conv.participant1_id;
          const p2Id = conv.participant2_id;

          const { data: p1 } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', p1Id)
            .single();

          const { data: p2 } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', p2Id)
            .single();

          return {
            id: conv.id,
            participant1_id: p1Id,
            participant2_id: p2Id,
            participant1_name: p1?.full_name || 'Unknown',
            participant2_name: p2?.full_name || 'Unknown',
            last_message: conv.last_message || null,
            last_message_time: conv.last_message_time || null,
            created_at: conv.created_at,
          };
        } catch (err) {
          console.warn('Error enriching conversation:', err);
          return {
            id: conv.id,
            participant1_id: conv.participant1_id,
            participant2_id: conv.participant2_id,
            participant1_name: 'Unknown',
            participant2_name: 'Unknown',
            last_message: conv.last_message || null,
            last_message_time: conv.last_message_time || null,
            created_at: conv.created_at,
          };
        }
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json([]);
  }
}
