import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'booking' | 'message' | 'review' | 'payment' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  subscriptionUnsubscribe: (() => void) | null;

  // Notification actions
  getNotifications: (userId: string, limit?: number) => Promise<Notification[]>;
  createNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<Notification>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: (userId: string) => Promise<void>;
  getUnreadCount: (userId: string) => Promise<number>;

  // Real-time subscriptions
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
}

export const useSupabaseNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  subscriptionUnsubscribe: null,

  getNotifications: async (userId, limit = 50) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const notifications = (data || []) as Notification[];
      set({ notifications });

      return notifications;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get notifications';
      set({ error: message });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  createNotification: async (notification) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const newNotification: Notification = {
        id: `notif_${Date.now()}`,
        ...notification,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('notifications')
        .insert(newNotification);

      if (error) throw error;

      set((state) => ({
        notifications: [newNotification, ...state.notifications],
      }));

      return newNotification;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create notification';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark notification as read';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  markAllAsRead: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark all as read';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  deleteNotification: async (notificationId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  deleteAllNotifications: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      set({ notifications: [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete notifications';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  getUnreadCount: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  },

  subscribeToNotifications: (userId) => {
    if (!supabase) return;

    const unsubscribe = supabase
      .from('notifications')
      .on('*', (payload) => {
        if (payload.new?.user_id === userId) {
          set((state) => {
            if (payload.eventType === 'DELETE') {
              return {
                notifications: state.notifications.filter((n) => n.id !== payload.old?.id),
              };
            }

            const notification = payload.new as Notification;
            const index = state.notifications.findIndex((n) => n.id === notification.id);

            if (index >= 0) {
              const updated = [...state.notifications];
              updated[index] = notification;
              return { notifications: updated };
            }

            return { notifications: [notification, ...state.notifications] };
          });
        }
      })
      .subscribe();

    set({ subscriptionUnsubscribe: () => unsubscribe.unsubscribe() });
  },

  unsubscribeFromNotifications: () => {
    const unsubscribe = get().subscriptionUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ subscriptionUnsubscribe: null });
    }
  },
}));
