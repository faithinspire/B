'use client';
// Universal chat page for braiders — works for any conversation
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check, Loader, ArrowLeft } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  read?: boolean;
}

export default function BraiderUniversalChatPage() {
  const router = useRouter();
  const params = useParams();
  const convId = params?.id as string;
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [conv, setConv] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) router.push('/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !convId) return;
    try {
      setLoading(true);
      setError(null);

      const convRes = await fetch(`/api/conversations/${convId}`);
      let convData: any = null;
      if (convRes.ok) {
        convData = await convRes.json();
      } else {
        const listRes = await fetch(`/api/conversations?user_id=${user.id}&role=braider`);
        if (listRes.ok) {
          const list = await listRes.json();
          convData = list.find((c: any) => c.id === convId);
        }
      }

      if (!convData) throw new Error('Conversation not found');

      const customerId = convData.customer_id;
      let other_name = 'Customer';
      let other_avatar = null;

      if (customerId && supabase) {
        const { data: p } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', customerId).single();
        if (p) { other_name = p.full_name || 'Customer'; other_avatar = p.avatar_url; }
      }

      setConv({ ...convData, other_name, other_avatar });

      const msgRes = await fetch(`/api/messages/conversation/${convId}?limit=100`);
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d?.messages || d || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [user, convId]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [user, authLoading, fetchData]);

  useEffect(() => {
    if (!convId || !supabase) return;
    const ch = supabase.channel(`braider_chat_${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (p: any) => {
          const m = p.new as Message;
          setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
        })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [convId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conv) return;

    const content = newMessage.trim();
    setNewMessage('');

    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: convId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      setSending(true);
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: convId, sender_id: user.id, sender_role: 'braider', content }),
      });
      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        throw new Error('Failed to send');
      }
      const sent = await res.json();
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? (sent.message || sent) : m));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="w-10 h-10 text-purple-600 animate-spin" /></div>;
  if (!user || user.role !== 'braider') return null;

  if (!conv) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="text-red-600 font-semibold mb-3">{error || 'Conversation not found'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0 z-10">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
          {conv.other_avatar ? <img src={conv.other_avatar} className="w-full h-full object-cover" alt="" /> : conv.other_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{conv.other_name}</p>
          <p className="text-xs text-green-500 font-medium">Customer</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <Send className="w-7 h-7 text-purple-500" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end mb-1">
                    {conv.other_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'}`}>
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && ((msg.is_read || msg.read) ? <CheckCheck className="w-3 h-3 text-purple-400" /> : <Check className="w-3 h-3 text-gray-400" />)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-3">
        {error && <p className="text-red-500 text-xs mb-2 px-1">{error}</p>}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={`Message ${conv.other_name}...`}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="w-11 h-11 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 disabled:opacity-40 transition-all flex-shrink-0"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <div className="flex-shrink-0 h-20 md:hidden" />
    </div>
  );
}
