'use client';

import { useEffect, useState } from 'react';
import { Search, Clock, X, Loader, Send } from 'lucide-react';

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
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
      result = result.filter(c =>
        String(c?.customer_name || '').toLowerCase().includes(q) ||
        String(c?.braider_name || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c?.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, conversations]);

  const fetchConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/conversations');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error loading conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversation?.id}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;
    try {
      setSendingMessage(true);
      const res = await fetch(`/api/admin/conversations/${selectedConversation?.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText }),
      });
      if (!res.ok) throw new Error('Failed');
      const newMessage = await res.json();
      setMessages([...messages, newMessage]);
      setMessageText('');
    } catch (err) {
      alert('Error sending message');
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600 mt-1">Monitor conversations</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-600">
          No conversations found
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((conversation) => (
            <div
              key={conversation?.id}
              onClick={() => handleSelectConversation(conversation)}
              className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{conversation?.customer_name}</h3>
                    <span className="text-gray-500">↔</span>
                    <h3 className="font-semibold">{conversation?.braider_name}</h3>
                  </div>
                  {conversation?.last_message && (
                    <p className="text-sm text-gray-600 line-clamp-1">{conversation.last_message}</p>
                  )}
                </div>
                {statusBadge(conversation?.status)}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{conversation?.message_count} messages</span>
                {conversation?.last_message_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conversation.last_message_time).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold">{selectedConversation?.customer_name} ↔ {selectedConversation?.braider_name}</h2>
                <p className="text-xs text-white/80">ID: {selectedConversation?.booking_id?.substring(0, 12)}</p>
              </div>
              <button onClick={() => setSelectedConversation(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No messages</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg?.id} className="flex gap-2">
                    <div className="flex-1">
                      <div className="bg-white rounded p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-600 mb-1">{msg?.sender_name}</p>
                        <p className="text-sm">{msg?.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg?.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 p-4 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageText.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50 text-sm"
              >
                {sendingMessage ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
