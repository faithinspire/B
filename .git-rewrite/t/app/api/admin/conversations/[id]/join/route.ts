import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface JoinConversationRequest {
  admin_id: string;
}

// POST /api/admin/conversations/[id]/join - Admin joins a conversation
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const body: JoinConversationRequest = await request.json();

    // Validate required fields
    if (!body.admin_id) {
      return NextResponse.json(
        { error: 'Missing required field: admin_id' },
        { status: 400 }
      );
    }

    // Validate admin_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.admin_id)) {
      return NextResponse.json(
        { error: 'Invalid admin_id format. Must be a valid UUID' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Verify conversation exists
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if admin is already in conversation
    if (conversation.admin_id === body.admin_id) {
      return NextResponse.json(
        { error: 'Admin is already in this conversation' },
        { status: 400 }
      );
    }

    // Update conversation with admin_id
    const now = new Date().toISOString();
    const { data: updatedConversation, error: updateError } = await serviceSupabase
      .from('conversations')
      .update({
        admin_id: body.admin_id,
        updated_at: now,
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json(
        { error: `Failed to update conversation: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Log access in admin_access_logs table
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { error: logError } = await serviceSupabase
      .from('admin_access_logs')
      .insert([
        {
          id: logId,
          admin_id: body.admin_id,
          conversation_id: conversationId,
          action: 'joined',
          timestamp: now,
        },
      ]);

    if (logError) {
      console.error('Error logging admin access:', logError);
      // Don't fail the request if logging fails, just log the error
    }

    return NextResponse.json(updatedConversation, { status: 200 });
  } catch (error) {
    console.error('Admin join conversation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to join conversation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
