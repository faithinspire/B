'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { createClient } from '@supabase/supabase-js';
import { Send, Loader, ArrowLeft, CheckCheck, Check } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function ConversationChatPage() {
  const router = useRouter();
  const params = useParams();
  const convId = params?.id as string;
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState('Seller');
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    if (!user || !convId) return;
    setLoading(true);
    try {
      const db = getDb();

      // Get conversation details
      const { data: conv } = await db
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();

      if (conv) {
        // Get other user's profile
        const otherId = conv.braider_id === user.id ? conv.customer_id : conv.braider_id;
        if (otherId) {
          const { data: profile } = await db
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', otherId)
            .single();
          if (profile) {
            setOtherName(profile.full_name || 'Seller');
            setOtherAvatar(profile.avatar_url);
          }
        }
      }

      // Get messages
      const { data: msgs } = await db
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);

      // Mark messages as read
      await db
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id);
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user, convId]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [user, authLoading, loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!convId || !user) return;
    const db = getDb();
    const channel = db
      .channel('conv_' + convId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, (payload: any) => {
        const msg = payload.new as Message;
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      })
      .subscribe();

    return () => { db.removeChannel(channel); };
  }, [convId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !convId || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const db = getDb();
      const { error: sendError } = await db.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content,
        created_at: new Date().toISOString(),
        read: false,
      });
      if (sendError) throw sendError;
      // Update conversation timestamp
      await db.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    } catch (err) {
      setError('Failed to send message');
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/messages')} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
          {otherAvatar
            ? <img src={otherAvatar} className="w-full h-full object-cover" alt="" />
            : otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{otherName}</p>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs sm:max-w-sm px-4 py-2 rounded-2xl text-sm ${
                msg.sender_id === user.id
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-white text-gray-900 shadow rounded-bl-md'
              }`}>
                <p>{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs justify-end ${
                  msg.sender_id === user.id ? 'text-purple-200' : 'text-gray-400'
                }`}>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.sender_id === user.id && (
                    msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 max-w-2xl mx-auto w-full">
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-gray-50"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
