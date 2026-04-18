import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Create or get conversation between users
 * NO DEPENDENCY on orders or bookings - users can chat freely
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customer_id, 
      braider_id, 
      initial_message,
      conversation_type = 'general' // 'general', 'booking', 'marketplace'
    } = body;

    // Validate required fields
    if (!customer_id || !braider_id) {
      return NextResponse.json(
        { success: false, error: 'customer_id and braider_id are required' },
        { status: 400 }
      );
    }

    // Prevent self-conversation
    if (customer_id === braider_id) {
      return NextResponse.json(
        { success: false, error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Check for existing conversation between these users
    const { data: existing, error: existingError } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('braider_id', braider_id)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing conversation:', existingError);
    }

    if (existing) {
      // Return existing conversation
      return NextResponse.json({
        success: true,
        conversation: existing,
        isNew: false,
      });
    }

    // Create new conversation
    const now = new Date().toISOString();
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        customer_id,
        braider_id,
        status: 'active',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      
      // Try with old schema (participant columns)
      const { data: fallbackConv, error: fallbackError } = await supabase
        .from('conversations')
        .insert({
          participant1_id: customer_id,
          participant2_id: braider_id,
          status: 'active',
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (fallbackError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        conversation: fallbackConv,
        isNew: true,
      });
    }

    // Send initial message if provided
    if (initial_message && newConversation) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: newConversation.id,
          sender_id: customer_id,
          sender_role: 'customer',
          content: initial_message,
          created_at: now,
        });
    }

    return NextResponse.json({
      success: true,
      conversation: newConversation,
      isNew: true,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * Get all conversations for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const role = searchParams.get('role');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    let query = supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    // Filter by role
    if (role === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (role === 'braider') {
      query = query.eq('braider_id', userId);
    } else {
      // Get all conversations where user is participant
      query = query.or(`customer_id.eq.${userId},braider_id.eq.${userId}`);
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get other user details for each conversation
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        const otherUserId = role === 'customer' ? conv.braider_id : conv.customer_id;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', otherUserId)
          .single();

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('read', false)
          .neq('sender_id', userId);

        return {
          ...conv,
          other_user: profile || null,
          last_message: lastMessage || null,
          unread_count: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
