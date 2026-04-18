'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageCircle, Loader, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface MarketplaceChatProps {
  orderId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  onClose?: () => void;
  isModal?: boolean;
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function MarketplaceChat({ orderId, otherUserId, otherUserName, otherUserAvatar, onClose, isModal = false }: MarketplaceChatProps) {
  const { user } = useSupabaseAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOrCreateConversation = useCallback(async () => {
    if (!user) return null;
    const db = getDb();
    if (!db) return null;

    try {
      // Check for existing conversation for this order
      const { data: existing } = await db
        .from('conversations')
        .select('id')
        .eq('booking_id', orderId)
        .maybeSingle();

      if (existing?.id) {
        console.log('Found existing conversation:', existing.id);
        return existing.id;
      }

      // Determine customer and braider IDs
      const customerId = user.id;
      const braiderId = otherUserId;

      console.log('Creating new conversation:', { orderId, customerId, braiderId });

      // Create new conversation with both schema formats
      const now = new Date().toISOString();
      const { data: newConv, error } = await db
        .from('conversations')
        .insert({
          booking_id: orderId,
          customer_id: customerId,
          braider_id: braiderId,
          participant1_id: customerId,
          participant2_id: braiderId,
          status: 'active',
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Error creating conversation:', error);
        // Try without participant columns
        const { data: newConv2, error: error2 } = await db
          .from('conversations')
          .insert({
            booking_id: orderId,
            customer_id: customerId,
            braider_id: braiderId,
            status: 'active',
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .maybeSingle();

        if (error2) {
          console.error('Second attempt failed:', error2);
          setError('Failed to create conversation. Please try again.');
          return null;
        }

        console.log('Created conversation (attempt 2):', newConv2?.id);
        return newConv2?.id || null;
      }

      console.log('Created conversation:', newConv?.id);
      return newConv?.id || null;
    } catch (err) {
      console.error('getOrCreateConversation error:', err);
      setError('Failed to initialize chat. Please refresh the page.');
      return null;
    }
  }, [user, orderId, otherUserId]);

  const loadMessages = useCallback(async (convId: string) => {
    const db = getDb();
    if (!db) return;

    try {
      const { data, error } = await db
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (data) {
        setMessages(data.map(m => ({
          ...m,
          sender_name: m.sender_id === user?.id ? 'You' : otherUserName,
        })));
      }
    } catch (err) {
      console.error('loadMessages error:', err);
    }
  }, [user?.id, otherUserName]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      
      const convId = await getOrCreateConversation();
      if (convId) {
        setConversationId(convId);
        await loadMessages(convId);

        // Subscribe to new messages
        const db = getDb();
        if (db) {
          const channel = db
            .channel(`messages:${convId}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${convId}`,
            }, (payload) => {
              const newMsg = payload.new as any;
              setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === newMsg.id)) return prev;
                return [...prev, {
                  ...newMsg,
                  sender_name: newMsg.sender_id === user?.id ? 'You' : otherUserName,
                }];
              });
              scrollToBottom();
            })
            .subscribe();

          return () => { db.removeChannel(channel); };
        }
      }
      setLoading(false);
    };

    if (user) init();
  }, [user, getOrCreateConversation, loadMessages, otherUserName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading && conversationId) {
      setLoading(false);
    }
  }, [loading, conversationId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user || sending) return;

    setSending(true);
    setError(null);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Insert message
      const { error: msgError } = await db.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        created_at: new Date().toISOString(),
      });

      if (msgError) {
        console.error('Send message error:', msgError);
        throw new Error(msgError.message);
      }

      // Update conversation updated_at
      await db.from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .catch(err => console.log('Could not update conversation timestamp:', err));

    } catch (err) {
      console.error('Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setNewMessage(content); // Restore on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const chatContent = (
    <div className={`flex flex-col ${isModal ? 'h-full' : 'h-[500px]'} bg-white`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center gap-3">
          {otherUserAvatar ? (
            <img src={otherUserAvatar} alt={otherUserName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {otherUserName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">{otherUserName}</p>
            <p className="text-xs text-purple-200">Order Chat</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : !conversationId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <AlertCircle className="w-12 h-12 text-red-300 mb-2" />
            <p className="text-sm">Could not load chat. Please refresh the page.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-purple-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            disabled={sending || !conversationId}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || !conversationId}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-1"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Press Enter to send</p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden rounded-t-2xl flex flex-col" style={{ height: '600px' }}>
          {chatContent}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {chatContent}
    </div>
  );
}
