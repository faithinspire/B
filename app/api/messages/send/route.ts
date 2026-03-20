import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversation_id, sender_id, sender_role, content, message_type, metadata } = body;

    if (!conversation_id || !sender_id || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Get conversation — verify it exists
    const { data: conversation, error: convError } = await db
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation lookup error:', convError?.message);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Determine the other participant (receiver)
    const customer_id = conversation.customer_id || conversation.participant1_id;
    const braider_id = conversation.braider_id || conversation.participant2_id;
    // For admin messages, notify both participants
    const receiver_id = sender_role === 'admin'
      ? (customer_id !== sender_id ? customer_id : braider_id)
      : sender_role === 'customer' ? braider_id : customer_id;

    // Verify sender is part of conversation
    // Also check participant1_id/participant2_id for old schema
    const allParticipants = [
      customer_id, braider_id,
      conversation.admin_id,
      conversation.participant1_id,
      conversation.participant2_id,
    ].filter(Boolean);

    const isPartOf = allParticipants.includes(sender_id) || sender_role === 'admin';

    if (!isPartOf) {
      console.error('Sender not in conversation. sender_id:', sender_id, 'participants:', allParticipants);
      return NextResponse.json({ error: 'Sender is not part of this conversation' }, { status: 403 });
    }

    let data: any = null;
    let lastError: any = null;

    // Attempt 1: full new schema
    const r1 = await db.from('messages').insert([{
      conversation_id,
      sender_id,
      content: content.trim(),
      sender_role: sender_role || 'customer',
      message_type: message_type || 'text',
      read: false,
      created_at: new Date().toISOString(),
    }]).select().single();
    if (!r1.error) { data = r1.data; }
    else {
      lastError = r1.error;
      console.error('Attempt 1 failed:', r1.error.message);

      // Attempt 2: new schema without optional cols
      const r2 = await db.from('messages').insert([{
        conversation_id,
        sender_id,
        content: content.trim(),
        read: false,
      }]).select().single();
      if (!r2.error) { data = r2.data; lastError = null; }
      else {
        lastError = r2.error;
        console.error('Attempt 2 failed:', r2.error.message);

        // Attempt 3: old schema — receiver_id instead of conversation_id
        if (receiver_id) {
          const r3 = await db.from('messages').insert([{
            sender_id,
            receiver_id,
            content: content.trim(),
            read: false,
          }]).select().single();
          if (!r3.error) { data = r3.data; lastError = null; }
          else {
            lastError = r3.error;
            console.error('Attempt 3 failed:', r3.error.message);

            // Attempt 4: old schema with is_read
            const r4 = await db.from('messages').insert([{
              sender_id,
              receiver_id,
              content: content.trim(),
              is_read: false,
            }]).select().single();
            if (!r4.error) { data = r4.data; lastError = null; }
            else {
              lastError = r4.error;
              console.error('Attempt 4 failed:', r4.error.message);

              // Attempt 5: absolute minimum old schema
              const r5 = await db.from('messages').insert([{
                sender_id,
                receiver_id,
                content: content.trim(),
              }]).select().single();
              if (!r5.error) { data = r5.data; lastError = null; }
              else {
                lastError = r5.error;
                console.error('Attempt 5 failed:', r5.error.message);
              }
            }
          }
        }
      }
    }

    if (lastError || !data) {
      console.error('All message insert attempts failed:', lastError);
      return NextResponse.json(
        { error: `Failed to send message: ${lastError?.message}. Run CRITICAL_DB_FIX_RUN_NOW.sql in Supabase.` },
        { status: 500 }
      );
    }

    // Ensure the returned message has conversation_id for the frontend
    const responseData = {
      ...data,
      conversation_id: data.conversation_id || conversation_id,
      created_at: data.created_at || data.timestamp || new Date().toISOString(),
    };

    // Notify recipient (best-effort)
    try {
      if (receiver_id && receiver_id !== sender_id) {
        const notifMsg = content.length > 60 ? content.slice(0, 60) + '...' : content;
        await db.from('notifications').insert({
          user_id: receiver_id,
          type: 'message',
          title: 'New Message',
          message: notifMsg,
          read: false,
        }).catch(() => {
          db.from('notifications').insert({
            user_id: receiver_id,
            type: 'message',
            title: 'New Message',
            message: notifMsg,
            is_read: false,
          }).catch(() => {});
        });
      }
    } catch {}

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
