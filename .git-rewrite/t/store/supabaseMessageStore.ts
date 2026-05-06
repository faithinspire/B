import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  content: string;
  timestamp: string;
  read: boolean;
  booking_id?: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant1_name: string;
  participant2_id: string;
  participant2_name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface MessageStore {
  messages: Message[];
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  subscriptionUnsubscribe: (() => void) | null;

  // Message actions
  sendMessage: (
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string,
    content: string,
    bookingId?: string
  ) => Promise<Message>;
  getConversation: (userId1: string, userId2: string) => Promise<Message[]>;
  getConversations: (userId: string) => Promise<Conversation[]>;
  markAsRead: (messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string, userId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  getUnreadCount: (userId: string) => Promise<number>;

  // Real-time subscriptions
  subscribeToMessages: (userId: string) => void;
  unsubscribeFromMessages: () => void;
}

export const useSupabaseMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  conversations: [],
  loading: false,
  error: null,
  subscriptionUnsubscribe: null,

  sendMessage: async (senderId, senderName, receiverId, receiverName, content, bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const message: Message = {
        id: `msg_${Date.now()}`,
        sender_id: senderId,
        sender_name: senderName,
        receiver_id: receiverId,
        receiver_name: receiverName,
        content,
        timestamp: new Date().toISOString(),
        read: false,
        booking_id: bookingId,
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(message);

      if (messageError) throw messageError;

      // Update or create conversation
      const conversationId = [senderId, receiverId].sort().join('_');
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (existingConversation) {
        await supabase
          .from('conversations')
          .update({
            last_message: content,
            last_message_time: message.timestamp,
          })
          .eq('id', conversationId);
      } else {
        const newConversation: Conversation = {
          id: conversationId,
          participant1_id: senderId,
          participant1_name: senderName,
          participant2_id: receiverId,
          participant2_name: receiverName,
          last_message: content,
          last_message_time: message.timestamp,
          unread_count: 1,
        };

        await supabase
          .from('conversations')
          .insert(newConversation);
      }

      set((state) => ({
        messages: [...state.messages, message],
      }));

      return message;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getConversation: async (userId1, userId2) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
        )
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const messages = (data || []) as Message[];
      set((state) => ({
        messages: [
          ...state.messages.filter(
            (m) =>
              !(
                (m.sender_id === userId1 && m.receiver_id === userId2) ||
                (m.sender_id === userId2 && m.receiver_id === userId1)
              )
          ),
          ...messages,
        ],
      }));

      return messages;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return [];
    }
  },

  getConversations: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('last_message_time', { ascending: false });

      if (error) throw error;

      const conversations = (data || []) as Conversation[];
      set({ conversations });

      return conversations;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  },

  markAsRead: async (messageId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, read: true } : m
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark message as read';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  markConversationAsRead: async (conversationId, userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', userId)
        .in('id', get().messages
          .filter((m) => m.receiver_id === userId && !m.read)
          .map((m) => m.id));

      if (error) throw error;

      set((state) => ({
        messages: state.messages.map((m) =>
          m.receiver_id === userId ? { ...m, read: true } : m
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark conversation as read';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  deleteMessage: async (messageId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete message';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  getUnreadCount: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  },

  subscribeToMessages: (userId) => {
    if (!supabase) return;

    const unsubscribe = supabase
      .from('messages')
      .on('*', (payload) => {
        const message = payload.new as Message;

        // Only update if message is for this user
        if (message.receiver_id === userId || message.sender_id === userId) {
          set((state) => {
            if (payload.eventType === 'DELETE') {
              return {
                messages: state.messages.filter((m) => m.id !== payload.old?.id),
              };
            }

            const index = state.messages.findIndex((m) => m.id === message.id);
            if (index >= 0) {
              const updated = [...state.messages];
              updated[index] = message;
              return { messages: updated };
            }

            return { messages: [...state.messages, message] };
          });
        }
      })
      .subscribe();

    set({ subscriptionUnsubscribe: () => unsubscribe.unsubscribe() });
  },

  unsubscribeFromMessages: () => {
    const unsubscribe = get().subscriptionUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ subscriptionUnsubscribe: null });
    }
  },
}));
