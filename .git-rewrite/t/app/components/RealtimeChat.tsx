'use client';

import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/store/supabaseChatStore';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Send, Phone, Loader, AlertCircle } from 'lucide-react';

interface RealtimeChatProps {
  bookingId: string;
  recipientId: string;
  recipientName: string;
}

export function RealtimeChat({ bookingId, recipientId, recipientName }: RealtimeChatProps) {
  const { user } = useSupabaseAuthStore();
  const { sendMessage, getMessages, subscribeToMessages, loading, error } = useChatStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadChatHistory();
    const unsubscribe = subscribeToMessages(bookingId, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      setLoadingMessages(true);
      const chatMessages = await getMessages(bookingId);
      setMessages(chatMessages);
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage(
        bookingId,
        user.id,
        user.full_name || 'User',
        user.role as 'braider' | 'customer',
        recipientId,
        newMessage
      );
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Typing indicator timeout
    }, 3000);
  };

  if (loadingMessages) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{recipientName}</h3>
          <p className="text-xs text-primary-100">Chat</p>
        </div>
        <button className="p-2 hover:bg-white/20 rounded-full transition-smooth">
          <Phone className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender_id === user?.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-600 transition-smooth"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-smooth flex items-center gap-2"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
