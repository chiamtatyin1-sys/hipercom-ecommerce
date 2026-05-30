import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { chatApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    { from: 'ai', text: 'Hello! 👋 How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(userMessage, sessionId);
      setMessages(prev => [...prev, { from: 'ai', text: res.data.message }]);
    } catch (error) {
      setMessages(prev => [...prev, { from: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">AI Assistant</h3>
          <p className="text-xs text-primary-200">Powered by AI</p>
        </div>
        <button onClick={onClose} className="text-white hover:text-primary-200">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.from === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={user ? 'Type a message...' : 'Login to get personalized help'}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}