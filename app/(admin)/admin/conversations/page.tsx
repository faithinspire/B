'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import {
  MessageCircle, Search, AlertCircle, Eye,
  Send, X, Users, CheckCheck, Check, RefreshCw,
} from 'lucide-react';

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
  customer_name?: string;
  braider_name?: string;
  message_count?: number;
  last_message?: string;
  last_message_time?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  message_type: string;
  read: boolean;
  created_at: string;
}

export default function AdminConversationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat panel state
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/conversations', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (convId: string) => {
    if (!supabase) return;
    try {
      setMessagesLoading(true);
      setChatError(null);
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setMessages(data || []);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Subscribe to new messages in selected conversation
  useEffect(() => {
    if (!selectedConv || !supabase) return;

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`admin-chat-${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          if (payload.new) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find((m) => m.id === (payload.new as Message).id)) return prev;
              return [...prev, payload.new as Message];
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (supabase) supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedConv]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = async (conv: Conversation) => {
    if (selectedConv?.id === conv.id) {
      setSelectedConv(null);
      setMessages([]);
      return;
    }
    setSelectedConv(conv);
    await fetchMessages(conv.id);
  };

  const handleJoinConversation = async () => {
    if (!selectedConv || !user) return;
    try {
      setJoining(true);
      setChatError(null);
      const response = await fetch(`/api/admin/conversations/${selectedConv.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join conversation');
      }
      // Update local state
      setSelectedConv((prev) => prev ? { ...prev, admin_id: user.id } : prev);
      setConversations((prev) =>
        prev.map((c) => c.id === selectedConv.id ? { ...c, admin_id: user.id } : c)
      );
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to join conversation');
    } finally {
      setJoining(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedConv) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setChatError(null);

    // Optimistic update
    const tempId = 'tmp_' + Date.now();
    const tempMsg: Message = {
      id: tempId,
      conversation_id: selectedConv.id,
      sender_id: user.id,
      sender_role: 'admin',
      content,
      message_type: 'text',
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      if (!supabase) throw new Error('Supabase not available');

      // Try inserting directly with all fields
      let inserted: any = null;
      const now = new Date().toISOString();

      const { data: d1, error: e1 } = await supabase.from('messages').insert({
        conversation_id: selectedConv.id,
        sender_id: user.id,
        sender_role: 'admin',
        content,
        read: false,
        created_at: now,
      }).select().single();

      if (!e1 && d1) {
        inserted = d1;
      } else {
        // Fallback: without sender_role
        const { data: d2, error: e2 } = await supabase.from('messages').insert({
          conversation_id: selectedConv.id,
          sender_id: user.id,
          content,
          read: false,
          created_at: now,
        }).select().single();

        if (!e2 && d2) {
          inserted = d2;
        } else {
          // Last resort: via API with service role
          const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: selectedConv.id,
              sender_id: user.id,
              sender_role: 'admin',
              content,
              message_type: 'text',
            }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to send message');
          }
          inserted = await response.json();
        }
      }

      // Replace temp message with real one
      if (inserted) {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...inserted, sender_role: inserted.sender_role || 'admin' } : m));
      }

      // Update conversation timestamp
      await supabase.from('conversations').update({ updated_at: now }).eq('id', selectedConv.id);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      (conv.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.braider_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.booking_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isAdminInConversation = selectedConv?.admin_id === user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">Conversations</h1>
            <p className="text-gray-600 text-sm mt-1">Monitor and participate in customer-braider chats</p>
          </div>
          <button
            onClick={fetchConversations}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: conversations.length, color: 'text-gray-900' },
            { label: 'Active', value: conversations.filter((c) => c.status === 'active').length, color: 'text-green-600' },
            { label: 'Completed', value: conversations.filter((c) => c.status === 'completed').length, color: 'text-blue-600' },
            { label: 'Archived', value: conversations.filter((c) => c.status === 'archived').length, color: 'text-gray-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-xs font-semibold mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-colors bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'completed', 'archived'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize text-sm ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={fetchConversations} className="mt-2 text-red-600 hover:text-red-700 font-semibold text-sm">
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversations List */}
          <div>
            {loading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
                <p className="text-gray-600 font-semibold">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-semibold">No conversations found</p>
                <p className="text-gray-500 mt-2 text-sm">
                  {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-4 cursor-pointer border-2 ${
                      selectedConv?.id === conv.id ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {conv.customer_name || 'Customer'} ↔ {conv.braider_name || 'Braider'}
                          </p>
                          {conv.admin_id && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{conv.booking_id.substring(0, 16)}...</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                          conv.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : conv.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {conv.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{conv.message_count || 0} messages</span>
                      <span>{new Date(conv.started_at).toLocaleDateString()}</span>
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{conv.last_message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="lg:sticky lg:top-4">
            {selectedConv ? (
              <div className="bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {selectedConv.customer_name || 'Customer'} ↔ {selectedConv.braider_name || 'Braider'}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">{selectedConv.booking_id.substring(0, 20)}...</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {!isAdminInConversation && (
                      <button
                        onClick={handleJoinConversation}
                        disabled={joining}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        {joining ? 'Joining...' : 'Join Chat'}
                      </button>
                    )}
                    {isAdminInConversation && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                        ● Joined
                      </span>
                    )}
                    <button
                      onClick={() => { setSelectedConv(null); setMessages([]); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-sm">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.sender_role === 'admin';
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-[75%]">
                            {!isMe && (
                              <p className="text-xs text-gray-500 mb-1 capitalize px-1">
                                {msg.sender_role}
                                {isAdmin && ' (Admin)'}
                              </p>
                            )}
                            <div
                              className={`px-3 py-2 rounded-lg text-sm ${
                                isMe
                                  ? 'bg-primary-600 text-white'
                                  : isAdmin
                                  ? 'bg-purple-100 text-purple-900'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                                <span>
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMe && (
                                  msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Error */}
                {chatError && (
                  <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                    <p className="text-xs text-red-600">{chatError}</p>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message as admin..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">Select a conversation</p>
                  <p className="text-gray-400 text-sm mt-1">Click any conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
