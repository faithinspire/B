import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );
}

// Normalize a raw conversation row to always have customer_id, braider_id, booking_id
function normalize(conv: any): any {
  return {
    ...conv,
    customer_id: conv.customer_id || conv.participant1_id || null,
    braider_id: conv.braider_id || conv.participant2_id || null,
    booking_id: conv.booking_id || null,
    status: conv.status || 'active',
    updated_at: conv.updated_at || conv.created_at || new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const role = searchParams.get('role');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const db = makeClient();

    // Try new schema first (customer_id / braider_id columns)
    let conversations: any[] = [];
    let usedOldSchema = false;

    const newQuery = db.from('conversations').select('*');
    if (role === 'customer') {
      newQuery.eq('customer_id', userId);
    } else if (role === 'braider') {
      newQuery.eq('braider_id', userId);
    } else if (role === 'admin') {
      newQuery.eq('admin_id', userId);
    } else {
      newQuery.or(`customer_id.eq.${userId},braider_id.eq.${userId},admin_id.eq.${userId}`);
    }
    newQuery.order('updated_at', { ascending: false });

    const { data: newData, error: newError } = await newQuery;

    if (!newError && newData && newData.length > 0) {
      conversations = newData.map(normalize);
    } else {
      // Fallback: old schema with participant1_id / participant2_id
      const { data: oldData, error: oldError } = await db
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (!oldError && oldData) {
        conversations = oldData.map(normalize);
        usedOldSchema = true;
      }
    }

    // Add unread counts
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        try {
          // Try read column
          const { count } = await db
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', userId);
          return { ...conv, unread_count: count || 0 };
        } catch {
          return { ...conv, unread_count: 0 };
        }
      })
    );

    return NextResponse.json(withUnread);
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, customer_id, braider_id } = body;

    if (!customer_id || !braider_id) {
      return NextResponse.json({ error: 'customer_id and braider_id are required' }, { status: 400 });
    }

    const db = makeClient();

    // Check if conversation already exists for this booking or these participants
    let existing: any = null;
    if (booking_id) {
      const { data } = await db.from('conversations').select('*').eq('booking_id', booking_id).maybeSingle();
      existing = data;
    }
    if (!existing) {
      const { data } = await db.from('conversations').select('*')
        .eq('customer_id', customer_id).eq('braider_id', braider_id).maybeSingle();
      existing = data;
    }
    if (!existing) {
      // Try old schema
      const { data } = await db.from('conversations').select('*')
        .eq('participant1_id', customer_id).eq('participant2_id', braider_id).maybeSingle();
      existing = data;
    }

    if (existing) return NextResponse.json(normalize(existing));

    const now = new Date().toISOString();

    // Try new schema insert first
    const { data, error } = await db.from('conversations').insert([{
      booking_id: booking_id || null,
      customer_id,
      braider_id,
      admin_id: null,
      status: 'active',
      started_at: now,
      created_at: now,
      updated_at: now,
    }]).select().single();

    if (!error && data) return NextResponse.json(normalize(data), { status: 201 });

    // Fallback: old schema
    const { data: data2, error: error2 } = await db.from('conversations').insert([{
      participant1_id: customer_id,
      participant2_id: braider_id,
      created_at: now,
    }]).select().single();

    if (error2) {
      console.error('Create conversation error:', error2);
      return NextResponse.json({ error: `Failed to create conversation: ${error2.message}` }, { status: 500 });
    }

    return NextResponse.json(normalize(data2), { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
