import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { message } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Get admin user from auth context
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get admin user
    const { data: { user: adminUser }, error: authError } = await serviceSupabase.auth.getUser(token);

    if (authError || !adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if admin
    const { data: adminProfile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can send messages' },
        { status: 403 }
      );
    }

    // Create or get conversation between admin and user
    const { data: existingConversation } = await serviceSupabase
      .from('bookings')
      .select('id')
      .or(`and(customer_id.eq.${userId},braider_id.eq.${adminUser.id}),and(customer_id.eq.${adminUser.id},braider_id.eq.${userId})`)
      .single();

    let conversationId = existingConversation?.id;

    if (!conversationId) {
      // Create a new conversation
      const { data: newConversation, error: createError } = await serviceSupabase
        .from('bookings')
        .insert({
          customer_id: userId,
          braider_id: adminUser.id,
          status: 'admin_message',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError || !newConversation) {
        console.error('Conversation creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 400 }
        );
      }

      conversationId = newConversation.id;
    }

    // Send message
    const { data: newMessage, error: messageError } = await serviceSupabase
      .from('reviews')
      .insert({
        booking_id: conversationId,
        sender_id: adminUser.id,
        receiver_id: userId,
        message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError) {
      console.error('Message creation error:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Send message error:', message);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
