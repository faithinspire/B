'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader, Download, MapPin, GripVertical } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  actions?: Array<{ label: string; action: string }>;
}

interface Position {
  x: number;
  y: number;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m Braidly\'s AI Assistant. I can help you book braiders, answer questions, process payments, and more. What would you like to do?',
      sender: 'ai',
      timestamp: new Date(),
      actions: [
        { label: '🔍 Find Braiders', action: 'search' },
        { label: '📅 Book Now', action: 'book' },
        { label: '💬 Contact Support', action: 'support' },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [buttonPosition, setButtonPosition] = useState<Position>({ x: 24, y: 24 });
  const [showMapModal, setShowMapModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWAPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle button drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: buttonPosition.x, y: buttonPosition.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const newX = Math.max(0, Math.min(window.innerWidth - 56, dragOffset.x + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 56, dragOffset.y + deltaY));

      setButtonPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleAction = (action: string) => {
    const actionMap: { [key: string]: string } = {
      search: 'I want to find braiders near me',
      book: 'I want to book a braider',
      support: 'I need help with my account',
      location: 'Show me braiders on the map',
      browse: 'Show me all available braiders',
      help: 'Tell me more about booking',
      security: 'How is my payment secure?',
      pricing: 'What are the pricing details?',
      bookings: 'Show my bookings',
      safety: 'Tell me about safety features',
      braider: 'I want to become a braider',
      dispute: 'I want to file a dispute',
      review: 'I want to leave a review',
      settings: 'Take me to settings',
      profile: 'Show my profile',
      referral: 'Show my referral link',
      earnings: 'Show my earnings',
      email: 'Contact support via email',
    };
    setInputValue(actionMap[action] || '');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
        actions: data.actions,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again or contact support at support@braidly.com',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPWAPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <div className="fixed bottom-32 right-6 z-50 bg-white rounded-2xl shadow-2xl p-4 sm:p-6 max-w-xs animate-scale-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900">Install Braidly</h4>
              <p className="text-sm text-gray-600 mt-1">Get quick access to book braiders</p>
            </div>
            <button
              onClick={() => setShowPWAPrompt(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleInstallPWA}
            className="w-full px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition-smooth font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <h3 className="font-semibold">Braiders Near You</h3>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-smooth"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">Map View</p>
                <p className="text-sm text-gray-500 mt-2">Showing braiders in your area</p>
                <p className="text-xs text-gray-400 mt-4">Map integration coming soon</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draggable Floating Button */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          zIndex: 50,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7" />
        ) : (
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        )}
      </button>

      {/* Chat Window - International Standard Size */}
      {isOpen && (
        <div className="fixed z-50 w-full sm:w-[420px] h-[70vh] sm:h-[600px] bg-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
          style={{
            bottom: 0,
            right: 0,
            left: 0,
            top: 'auto',
          }}
        >
          {/* Header with Drag Handle */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 flex-1">
              <div
                data-no-drag="true"
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/20 rounded"
              >
                <GripVertical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Braidly AI</h3>
                <p className="text-xs sm:text-sm opacity-90">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              data-no-drag="true"
              className="p-2 hover:bg-white/20 rounded-lg transition-smooth"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-xs px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{message.text}</p>
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAction(action.action)}
                          className="w-full px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-semibold hover:bg-primary-200 transition-smooth active:scale-95"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 px-3 sm:px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-xs sm:text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - Fixed at bottom */}
          <div className="border-t border-gray-200 p-3 sm:p-4 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 text-xs sm:text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 active:scale-95"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
