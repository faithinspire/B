'use client';

import { useEffect, useState } from 'react';
import { Search, Clock, X, Loader, Send, AlertCircle } from 'lucide-react';

interface Conversation {
  id: string;
  participant1_name: string;
  participant2_name: string;
  last_message: string | null;
  last_message_time: string | null;
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
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
        String(c?.participant1_name || '').toLowerCase().includes(q) ||
        String(c?.participant2_name || '').toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, conversations]);

  const fetchConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/conversations', { cache: 'no-store' });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setConversations(data);
        setFiltered(data);
      } else {
        setConversations([]);
        setFiltered([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load conversations');
      setConversations([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversation?.id}`, { cache: 'no-store' });
      const data = await res.json();
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (err) {
      console.error('Messages fetch error:', err);
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
      if (res.ok) {
        const newMessage = await res.json();
        setMessages([...messages, newMessage]);
        setMessageText('');
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600 mt-1">Monitor all conversations</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchConversations}
              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((conversation) => (
            <div
              key={conversation?.id}
              onClick={() => handleSelectConversation(conversation)}
              className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{conversation?.participant1_name}</p>
                    <span className="text-gray-400">↔</span>
                    <p className="font-semibold text-gray-900">{conversation?.participant2_name}</p>
                  </div>
                  {conversation?.last_message && (
                    <p className="text-sm text-gray-600 line-clamp-1">{conversation.last_message}</p>
                  )}
                </div>
              </div>
              {conversation?.last_message_time && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                  <Clock className="w-3 h-3" />
                  {new Date(conversation.last_message_time).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold">{selectedConversation?.participant1_name} ↔ {selectedConversation?.participant2_name}</h2>
              </div>
              <button onClick={() => setSelectedConversation(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No messages</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="flex-1">
                      <div className="bg-white rounded p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-600 mb-1">{msg?.sender_name}</p>
                        <p className="text-sm text-gray-900">{msg?.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {msg?.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}
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
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm"
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
