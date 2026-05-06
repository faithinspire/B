'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  message_type: string;
  metadata: Record<string, any> | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

interface LocationTracking {
  id: string;
  booking_id: string;
  braider_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  is_active: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  admin_id: string | null;
  status: 'active' | 'completed' | 'archived';
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseConversationSubscriptionReturn {
  isConnected: boolean;
  error: string | null;
}

export function useConversationSubscription(
  conversationId: string,
  onNewMessage: (message: Message) => void,
  onLocationUpdate: (location: LocationTracking) => void,
  onConversationUpdate: (conversation: Conversation) => void
): UseConversationSubscriptionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    channelsRef.current.forEach((ch) => {
      try { supabase.removeChannel(ch); } catch {}
    });
    channelsRef.current = [];
  }, []);

  const setupSubscriptions = useCallback(() => {
    if (!supabase || !conversationId) {
      setError('Supabase not configured');
      return;
    }

    cleanup();

    try {
      // Messages channel - new Realtime API syntax
      const messagesChannel = supabase
        .channel(`conv-messages-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            if (payload.new && mountedRef.current) {
              onNewMessage(payload.new as Message);
            }
          }
        )
        .subscribe((status) => {
          if (!mountedRef.current) return;
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setError(null);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            setError('Connection lost, reconnecting...');
            // Auto-reconnect after 3s
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) setupSubscriptions();
            }, 3000);
          } else if (status === 'CLOSED') {
            setIsConnected(false);
          }
        });

      channelsRef.current.push(messagesChannel);

      // Location channel
      const locationChannel = supabase
        .channel(`conv-location-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'location_tracking',
          },
          (payload) => {
            if (payload.new && mountedRef.current) {
              onLocationUpdate(payload.new as LocationTracking);
            }
          }
        )
        .subscribe();

      channelsRef.current.push(locationChannel);

      // Conversation updates channel
      const conversationChannel = supabase
        .channel(`conv-updates-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
            filter: `id=eq.${conversationId}`,
          },
          (payload) => {
            if (payload.new && mountedRef.current) {
              onConversationUpdate(payload.new as Conversation);
            }
          }
        )
        .subscribe();

      channelsRef.current.push(conversationChannel);
    } catch (err) {
      console.error('Subscription setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup subscriptions');
      setIsConnected(false);
    }
  }, [conversationId, onNewMessage, onLocationUpdate, onConversationUpdate, cleanup]);

  useEffect(() => {
    mountedRef.current = true;
    setupSubscriptions();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      cleanup();
    };
  }, [setupSubscriptions, cleanup]);

  return { isConnected, error };
}
