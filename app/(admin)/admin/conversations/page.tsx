'use client';

import { useEffect, useState } from 'react';
import { Search, MessageCircle, Clock, X, Loader, AlertCircle, Send } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  braider_name: string;
  message_count: number;
  last_message: string | null;
  last_message_time: string | null;
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    let result = conversations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.customer_name.toLowerCase().includes(q) ||
          c.braider_name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, conversations]);

  async function fetchConversations() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/conversations');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch conversations');
      }
      const data = await res.json();
      setConversations(data);
      setFiltered(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversation.id}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const res = await fetch(`/api/admin/conversations/${selectedConversation.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      
      const newMessage = await res.json();
      setMessages([...messages, newMessage]);
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      ended: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600 mt-1">Monitor and manage customer-braider conversations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer or braider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Conversations List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-primary-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{conversation.customer_name}</h3>
                    <span className="text-gray-500">↔</span>
                    <h3 className="text-lg font-semibold text-gray-900">{conversation.braider_name}</h3>
                  </div>
                  {conversation.last_message && (
                    <p className="text-sm text-gray-600 line-clamp-1">{conversation.last_message}</p>
                  )}
                </div>
                {statusBadge(conversation.status)}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{conversation.message_count} messages</span>
                {conversation.last_message_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conversation.last_message_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedConversation.customer_name} ↔ {selectedConversation.braider_name}</h2>
                <p className="text-sm text-white/80 mt-1">Booking ID: {selectedConversation.booking_id.substring(0, 12)}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  setMessages([]);
                }}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-600 mb-1">{msg.sender_name}</p>
                        <p className="text-gray-900">{msg.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageText.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-semibold flex items-center gap-2"
                >
                  {sendingMessage ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
