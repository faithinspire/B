'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, CheckCheck, Check, Loader, ArrowLeft } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  braider_id: string;
  customer_id: string;
  booking_id?: string | null;
  braider_name?: string;
  braider_avatar?: string;
}

export default function DirectChatPage() {
  const router = useRouter();
  const params = useParams();
  const conv_id = params?.id as string;
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !conv_id) return;
    try {
      setLoading(true);
      setError(null);

      // Get conversation details
      const convRes = await fetch(`/api/conversations/${conv_id}`);
      if (!convRes.ok) throw new Error('Conversation not found');
      const convData = await convRes.json();
      // Handle both { conversation: {...} } and direct object
      const conv = convData.conversation || convData;

      // Get braider name
      const braiderId = conv.braider_id || conv.participant2_id;
      if (braiderId) {
        try {
          const profileRes = await fetch(`/api/braiders/${braiderId}`);
          if (profileRes.ok) {
            const profile = await profileRes.json();
            conv.braider_name = profile.full_name;
            conv.braider_avatar = profile.avatar_url;
          }
        } catch {}
      }

      setConversation({ ...conv, braider_id: braiderId });

      // Get messages
      const msgRes = await fetch(`/api/messages/conversation/${conv_id}?user_id=${user.id}&limit=100`);
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(Array.isArray(d) ? d : (d?.messages || []));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [user, conv_id]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [user, authLoading, fetchData]);

  useEffect(() => {
    if (!conversation || !supabase) return;
    const ch = supabase
      .channel('dc_' + conversation.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'conversation_id=eq.' + conversation.id,
      }, (p: any) => {
        const m: Message = p.new;
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation) return;
    try {
      setSending(true);
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_role: 'customer',
          content: newMessage.trim(),
          message_type: 'text',
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="w-10 h-10 text-purple-600 animate-spin"/></div>;
  }
  if (!user || user.role !== 'customer') return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/messages')} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5 text-gray-600"/>
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden">
          {conversation?.braider_avatar
            ? <img src={conversation.braider_avatar} className="w-full h-full object-cover" alt=""/>
            : (conversation?.braider_name?.charAt(0)?.toUpperCase() || 'B')}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{conversation?.braider_name || 'Braider'}</p>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-20">
            <p className="text-gray-400 text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.sender_id === user.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
                <p>{msg.content}</p>
                <div className="flex items-center gap-1 mt-1 text-xs opacity-60 justify-end">
                  <span>{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                  {msg.sender_id === user.id && (msg.is_read ? <CheckCheck className="w-3 h-3"/> : <Check className="w-3 h-3"/>)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-3 max-w-2xl mx-auto w-full">
        {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            disabled={sending}
            autoFocus
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4"/>
          </button>
        </form>
      </div>
    </div>
  );
}
