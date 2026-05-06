import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'braider' | 'customer';
  recipient_id: string;
  message: string;
  image_url?: string;
  read: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  booking_id: string;
  braider_id: string;
  customer_id: string;
  braider_name: string;
  customer_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: 'active' | 'completed' | 'archived';
}

interface ChatStore {
  messages: Record<string, ChatMessage[]>;
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  loading: boolean;
  error: string | null;
  typingUsers: Record<string, boolean>;

  // Message actions
  sendMessage: (bookingId: string, senderId: string, senderName: string, senderType: 'braider' | 'customer', recipientId: string, message: string, imageUrl?: string) => Promise<ChatMessage>;
  getMessages: (bookingId: string) => Promise<ChatMessage[]>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;

  // Conversation actions
  getConversations: (userId: string) => Promise<ChatConversation[]>;
  getConversation: (bookingId: string) => Promise<ChatConversation | null>;
  setCurrentConversation: (conversation: ChatConversation) => void;

  // Typing indicators
  setTyping: (bookingId: string, userId: string, isTyping: boolean) => Promise<void>;
  getTypingUsers: (bookingId: string) => Record<string, boolean>;

  // Real-time subscriptions
  subscribeToMessages: (bookingId: string, callback: (message: ChatMessage) => void) => (() => void) | undefined;
  subscribeToConversations: (userId: string, callback: (conversations: ChatConversation[]) => void) => (() => void) | undefined;
  subscribeToTyping: (bookingId: string, callback: (typingUsers: Record<string, boolean>) => void) => (() => void) | undefined;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: {},
  conversations: [],
  currentConversation: null,
  loading: false,
  error: null,
  typingUsers: {},

  sendMessage: async (bookingId, senderId, senderName, senderType, recipientId, message, imageUrl) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        booking_id: bookingId,
        sender_id: senderId,
        sender_name: senderName,
        sender_type: senderType,
        recipient_id: recipientId,
        message,
        image_url: imageUrl,
        read: false,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          booking_id: bookingId,
          sender_id: senderId,
          sender_name: senderName,
          sender_type: senderType,
          recipient_id: recipientId,
          message,
          image_url: imageUrl,
          read: false,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      set((state) => ({
        messages: {
          ...state.messages,
          [bookingId]: [...(state.messages[bookingId] || []), chatMessage],
        },
      }));

      return chatMessage;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getMessages: async (bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages = (data || []) as ChatMessage[];
      set((state) => ({
        messages: { ...state.messages, [bookingId]: messages },
      }));

      return messages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  },

  markAsRead: async (messageId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  },

  deleteMessage: async (messageId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete message';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getConversations: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .or(`braider_id.eq.${userId},customer_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const conversations = (data || []) as ChatConversation[];
      set({ conversations });
      return conversations;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  },

  getConversation: async (bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error) throw error;

      const conversation = data as ChatConversation;
      set({ currentConversation: conversation });
      return conversation;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return null;
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  setTyping: async (bookingId, userId, isTyping) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          booking_id: bookingId,
          user_id: userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'booking_id,user_id' });
    } catch (error) {
      console.error('Failed to set typing indicator:', error);
    }
  },

  getTypingUsers: (bookingId) => {
    return get().typingUsers[bookingId] || {};
  },

  subscribeToMessages: (bookingId, callback) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`messages_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },

  subscribeToConversations: (userId, callback) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`conversations_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: `braider_id=eq.${userId},customer_id=eq.${userId}`,
        },
        (payload) => {
          get().getConversations(userId).then(callback);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },

  subscribeToTyping: (bookingId, callback) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`typing_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const typingUsers = get().typingUsers;
          typingUsers[bookingId] = payload.new as any;
          callback(typingUsers);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
}));
