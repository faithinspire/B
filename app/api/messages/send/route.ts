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
      console.error('Conversation lookup error:', convError);
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

    let data: any = null;
    let lastError: any = null;

    // Attempt 1: full schema with all columns
    const res1 = await serviceSupabase.from('messages').insert([{
      conversation_id,
      sender_id,
      content: content.trim(),
      sender_role: sender_role || 'customer',
      message_type: message_type || 'text',
      metadata: metadata || null,
      read: false,
    }]).select().single();

    if (!res1.error) {
      data = res1.data;
    } else {
      lastError = res1.error;
      console.error('Attempt 1 failed:', res1.error.message);

      // Attempt 2: without optional columns, try read column
      const res2 = await serviceSupabase.from('messages').insert([{
        conversation_id,
        sender_id,
        content: content.trim(),
        read: false,
      }]).select().single();

      if (!res2.error) {
        data = res2.data;
        lastError = null;
      } else {
        lastError = res2.error;
        console.error('Attempt 2 failed:', res2.error.message);

        // Attempt 3: try with is_read instead
        const res3 = await serviceSupabase.from('messages').insert([{
          conversation_id,
          sender_id,
          content: content.trim(),
          is_read: false,
        }]).select().single();

        if (!res3.error) {
          data = res3.data;
          lastError = null;
        } else {
          lastError = res3.error;
          console.error('Attempt 3 failed:', res3.error.message);

          // Attempt 4: absolute bare minimum — just the 3 core fields
          const res4 = await serviceSupabase.from('messages').insert([{
            conversation_id,
            sender_id,
            content: content.trim(),
          }]).select().single();

          if (!res4.error) {
            data = res4.data;
            lastError = null;
          } else {
            lastError = res4.error;
            console.error('Attempt 4 failed:', res4.error.message);
          }
        }
      }
    }

    if (lastError || !data) {
      console.error('All message insert attempts failed. Last error:', lastError);
      return NextResponse.json(
        { error: `Failed to send message: ${lastError?.message || 'Unknown error'}. Please run CRITICAL_DB_FIX_RUN_NOW.sql in Supabase.` },
        { status: 500 }
      );
    }

    // Notify recipient (best-effort, never block the response)
    try {
      const recipientId =
        sender_role === 'customer' ? conversation.braider_id :
        sender_role === 'braider' ? conversation.customer_id :
        conversation.customer_id;
      if (recipientId && recipientId !== sender_id) {
        const notifMsg = content.length > 60 ? content.slice(0, 60) + '...' : content;
        await serviceSupabase.from('notifications').insert({
          user_id: recipientId,
          type: 'message',
          title: 'New Message',
          message: notifMsg,
          read: false,
        }).catch(() => {
          serviceSupabase.from('notifications').insert({
            user_id: recipientId,
            type: 'message',
            title: 'New Message',
            message: notifMsg,
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
