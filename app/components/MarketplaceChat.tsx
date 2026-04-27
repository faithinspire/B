'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, Send, Loader } from 'lucide-react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

interface MarketplaceChatProps {
  orderId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  onClose?: () => void;
  isModal?: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export function MarketplaceChat({ orderId, otherUserId, otherUserName, otherUserAvatar, onClose, isModal = false }: MarketplaceChatProps) {
  const { user } = useSupabaseAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && otherUserId) {
      initConversation();
    }
  }, [user, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initConversation = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Determine who is customer and who is braider based on context
      // The current user could be either buyer or seller
      const customerId = user.id;
      const braiderId = otherUserId;

      // Create or get conversation
      const res = await fetch('/api/chat/create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          braider_id: braiderId,
          initial_message: undefined, // Don't auto-send initial message
        }),
      });

      const data = await res.json();

      if (data.success && data.conversation) {
        setConversationId(data.conversation.id);
        await fetchMessages(data.conversation.id);
      } else {
        // API failed — still allow typing by creating a local conversation ID placeholder
        console.error('Failed to init conversation:', data.error);
        // Try the conversations API as fallback
        const fallbackRes = await fetch(`/api/conversations?user_id=${user.id}&role=customer`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const existing = Array.isArray(fallbackData) 
            ? fallbackData.find((c: any) => c.braider_id === otherUserId || c.customer_id === otherUserId)
            : null;
          if (existing) {
            setConversationId(existing.id);
            await fetchMessages(existing.id);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) return;

      const client = createClient(supabaseUrl, anonKey);

      const { data, error } = await client
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      // If we have a conversation ID, use the messages API
      if (conversationId) {
        const res = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            sender_id: user.id,
            sender_role: 'customer',
            content,
            message_type: 'text',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const newMsg = data.message || data;
          if (newMsg?.id) {
            setMessages(prev => [...prev, newMsg]);
          } else {
            // Optimistic update
            setMessages(prev => [...prev, {
              id: `temp-${Date.now()}`,
              conversation_id: conversationId,
              sender_id: user.id,
              content,
              created_at: new Date().toISOString(),
              read: false,
            }]);
          }
        } else {
          // Fallback: direct Supabase insert
          await sendViaSupabase(content);
        }
      } else {
        // No conversation yet — create one first then send
        const createRes = await fetch('/api/chat/create-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: user.id,
            braider_id: otherUserId,
          }),
        });
        const createData = await createRes.json();
        if (createData.success && createData.conversation) {
          const newConvId = createData.conversation.id;
          setConversationId(newConvId);
          
          const res = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: newConvId,
              sender_id: user.id,
              sender_role: 'customer',
              content,
              message_type: 'text',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const newMsg = data.message || data;
            if (newMsg?.id) setMessages(prev => [...prev, newMsg]);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const sendViaSupabase = async (content: string) => {
    if (!conversationId || !user) return;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) return;
      const client = createClient(supabaseUrl, anonKey);
      const { data, error } = await client
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          created_at: new Date().toISOString(),
          read: false,
        })
        .select()
        .single();
      if (!error && data) {
        setMessages(prev => [...prev, data]);
      }
    } catch (err) {
      console.error('Supabase send error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const content = (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-lg" style={{ height: isModal ? '100%' : '70vh', minHeight: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          {otherUserAvatar ? (
            <img src={otherUserAvatar} alt={otherUserName} className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {otherUserName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm">{otherUserName}</h3>
            <p className="text-xs text-purple-100">Order #{orderId.slice(0, 8)}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={() => onClose()} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.sender_id === user?.id
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 rounded-bl-md shadow'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-purple-200' : 'text-gray-400'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — always visible at bottom */}
      <div className="flex-shrink-0 p-3 border-t bg-white">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md h-[600px] max-h-[85vh]">
          {content}
        </div>
      </div>
    );
  }

  return <div className="w-full">{content}</div>;
}
