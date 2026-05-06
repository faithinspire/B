import { create } from 'zustand';

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

  // Message actions
  sendMessage: (senderId: string, senderName: string, receiverId: string, receiverName: string, content: string, bookingId?: string) => void;
  getConversation: (userId1: string, userId2: string) => Message[];
  getConversations: (userId: string) => Conversation[];
  markAsRead: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  getUnreadCount: (userId: string) => number;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
      messages: [],
      conversations: [],
      loading: false,
      error: null,

      sendMessage: (senderId, senderName, receiverId, receiverName, content, bookingId) => {
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

          set((state) => ({
            messages: [...state.messages, message],
          }));

          // Update or create conversation
          const conversationId = [senderId, receiverId].sort().join('_');
          const existingConversation = get().conversations.find(
            (c) =>
              (c.participant1_id === senderId && c.participant2_id === receiverId) ||
              (c.participant1_id === receiverId && c.participant2_id === senderId)
          );

          if (existingConversation) {
            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === existingConversation.id
                  ? {
                      ...c,
                      last_message: content,
                      last_message_time: message.timestamp,
                    }
                  : c
              ),
            }));
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
            set((state) => ({
              conversations: [...state.conversations, newConversation],
            }));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to send message';
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      getConversation: (userId1, userId2) => {
        return get().messages.filter(
          (m) =>
            (m.sender_id === userId1 && m.receiver_id === userId2) ||
            (m.sender_id === userId2 && m.receiver_id === userId1)
        );
      },

      getConversations: (userId) => {
        return get().conversations.filter(
          (c) => c.participant1_id === userId || c.participant2_id === userId
        );
      },

      markAsRead: (messageId) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, read: true } : m
          ),
        }));
      },

      deleteMessage: (messageId) => {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== messageId),
        }));
      },

      getUnreadCount: (userId) => {
        return get().messages.filter((m) => m.receiver_id === userId && !m.read).length;
      },
    }));
