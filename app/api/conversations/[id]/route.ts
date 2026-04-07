import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Types
interface UpdateConversationRequest {
  status?: 'active' | 'completed' | 'archived';
  admin_id?: string | null;
  ended_at?: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Fetch conversation by ID or booking_id
    const { data: conversation, error: convError } = await db
      .from('conversations')
      .select('*')
      .or(`id.eq.${conversationId},booking_id.eq.${conversationId}`)
      .single();

    if (convError || !conversation) {
      console.error('Conversation fetch error:', convError?.message);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateConversationRequest = await request.json();

    // Validate at least one field is provided
    if (!body.status && body.admin_id === undefined && !body.ended_at) {
      return NextResponse.json(
        { error: 'At least one field must be provided: status, admin_id, or ended_at' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !['active', 'completed', 'archived'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, completed, archived' },
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
      .eq('id', params.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.admin_id !== undefined) {
      updateData.admin_id = body.admin_id;
    }

    if (body.ended_at) {
      updateData.ended_at = body.ended_at;
    }

    // Track if admin_id changed for logging
    const adminIdChanged = body.admin_id !== undefined && body.admin_id !== conversation.admin_id;

    // Update conversation
    const { data, error } = await serviceSupabase
      .from('conversations')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json(
        { error: `Failed to update conversation: ${error.message}` },
        { status: 500 }
      );
    }

    // Log admin access if admin_id changed
    if (adminIdChanged && body.admin_id) {
      await serviceSupabase
        .from('admin_access_logs')
        .insert([
          {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            admin_id: body.admin_id,
            conversation_id: params.id,
            action: 'joined_conversation',
            timestamp: new Date().toISOString(),
          },
        ]);
    } else if (adminIdChanged && !body.admin_id && conversation.admin_id) {
      // Log when admin leaves
      await serviceSupabase
        .from('admin_access_logs')
        .insert([
          {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            admin_id: conversation.admin_id,
            conversation_id: params.id,
            action: 'left_conversation',
            timestamp: new Date().toISOString(),
          },
        ]);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update conversation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update conversation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
