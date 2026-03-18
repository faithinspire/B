'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface LocationUpdate {
  id: string;
  booking_id: string;
  braider_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  created_at: string;
}

export function useBraiderSubscription(
  booking_id: string,
  onNewMessage?: (message: Message) => void,
  onLocationUpdate?: (location: LocationUpdate) => void
) {
  const { user } = useSupabaseAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    channelsRef.current.forEach((ch) => {
      try { supabase.removeChannel(ch); } catch {}
    });
    channelsRef.current = [];
  }, []);

  // Get conversation ID
  useEffect(() => {
    if (!user || !booking_id) return;

    const getConversationId = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('booking_id', booking_id)
          .eq('braider_id', user.id)
          .single();

        if (error) throw error;
        if (mountedRef.current) setConversationId(data?.id || null);
      } catch (err) {
        console.error('Error getting conversation ID:', err);
      }
    };

    getConversationId();
  }, [user, booking_id]);

  // Subscribe to messages using new Realtime API
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`braider-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new && mountedRef.current && onNewMessage) {
            onNewMessage(payload.new as Message);
          }
        }
      )
      .subscribe((status) => {
        if (!mountedRef.current) return;
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          // Auto-reconnect after 3s
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              supabase.removeChannel(channel);
              channelsRef.current = channelsRef.current.filter((c) => c !== channel);
            }
          }, 3000);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelsRef.current.push(channel);

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current = channelsRef.current.filter((c) => c !== channel);
    };
  }, [conversationId, onNewMessage]);

  // Subscribe to location updates
  useEffect(() => {
    if (!booking_id) return;

    const channel = supabase
      .channel(`braider-location-sub-${booking_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
          filter: `booking_id=eq.${booking_id}`,
        },
        (payload) => {
          if (payload.new && mountedRef.current && onLocationUpdate) {
            onLocationUpdate(payload.new as LocationUpdate);
          }
        }
      )
      .subscribe();

    channelsRef.current.push(channel);

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current = channelsRef.current.filter((c) => c !== channel);
    };
  }, [booking_id, onLocationUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      cleanup();
    };
  }, [cleanup]);

  return { isConnected };
}
