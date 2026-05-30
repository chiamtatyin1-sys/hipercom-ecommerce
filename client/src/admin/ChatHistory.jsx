import { useState, useEffect } from 'react';
import { MessageCircle, Search, User } from 'lucide-react';
import { chatApi } from '../services/api';

export default function AdminChatHistory() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    try {
      const res = await chatApi.getHistory();
      setMessages(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const filteredMessages = messages.filter(m => 
    m.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.response?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by session
  const groupedMessages = filteredMessages.reduce((acc, msg) => {
    const session = msg.sessionId || 'unknown';
    if (!acc[session]) acc[session] = [];
    acc[session].push(msg);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading chat history...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Chat History</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            className="input pl-10 w-64"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {Object.entries(groupedMessages).map(([sessionId, msgs]) => (
          <div key={sessionId} className="card p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {msgs[0]?.user?.username || 'Guest User'}
                </p>
                <p className="text-xs text-gray-500">
                  {msgs.length} messages • {new Date(msgs[0]?.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {msgs.slice(0, 5).map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-primary-600">User:</span>
                    <span>{msg.message}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="font-medium text-green-600">AI:</span>
                    <span className="text-gray-600">{msg.response?.substring(0, 100)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredMessages.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No chat messages found</p>
        </div>
      )}
    </div>
  );
}