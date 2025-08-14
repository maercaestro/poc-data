import React, { useState, useEffect, useRef } from 'react';

// API helper functions
async function newSession() {
  const response = await fetch('/api/chat/new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
}

async function fetchHistory(sessionId) {
  const response = await fetch(`/api/chat/history?session_id=${sessionId}`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}

async function sendMessage(sessionId, message, contextData = null) {
  const requestBody = { session_id: sessionId, message };
  if (contextData) {
    requestBody.context_data = contextData;
  }
  
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}

function ChatBox({ selectedQuery, onQueryProcessed }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const endRef = useRef(null);

  // Load context data from localStorage on component mount
  useEffect(() => {
    const storedData = localStorage.getItem('agentData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setContextData(data);
      } catch (e) {
        console.error('Failed to parse stored agent data:', e);
      }
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session on mount
  useEffect(() => {
    async function initializeSession() {
      try {
        const session = await newSession();
        setSessionId(session.session_id);
        
        // Fetch history after creating session
        const history = await fetchHistory(session.session_id);
        setMessages(history.messages || []);
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    }
    
    initializeSession();
  }, []);

  // Handle selectedQuery from AgentDemoPage
  useEffect(() => {
    if (selectedQuery && sessionId) {
      handleSendMessage(selectedQuery);
      if (onQueryProcessed) {
        onQueryProcessed();
      }
    }
  }, [selectedQuery, sessionId]);

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading || !sessionId) return;

    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessage(sessionId, message, contextData);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Sorry, I encountered an error: ${error.message}`,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Starter suggestions based on menu context
  const starterSuggestions = contextData ? [
    "What are your most popular dishes?",
    "Do you have any vegetarian options?", 
    "What would you recommend for dinner?",
    "Can you tell me about today's specials?"
  ] : [
    "Hello! I'd like to see your menu.",
    "What kind of food do you serve?",
    "Are you open for dining?",
    "Can you tell me about your restaurant?"
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#192A56' }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#192A56' }}>CANTA Server</h3>
          <p className="text-sm text-gray-500">Ready to help you order!</p>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto max-h-[70vh] px-3 py-2 space-y-4">
        {messages.length === 0 ? (
          // Empty state with starter suggestions
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {contextData ? 
                `Welcome! I can see we have ${contextData.items?.length || 0} delicious items on our menu. How can I help you today?` :
                'Welcome! How can I help you today?'
              }
            </p>
            <div className="space-y-2">
              {starterSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(suggestion)}
                  className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm transition-colors"
                  style={{ color: '#192A56' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Message bubbles
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${message.role === 'system' ? 'justify-center' : ''}`}
            >
              <div
                className={`
                  max-w-[80%] px-3 py-2 rounded-2xl
                  ${message.role === 'user' 
                    ? 'bg-indigo-600 text-white self-end' 
                    : message.role === 'system'
                    ? 'bg-yellow-100 text-yellow-800 text-sm italic'
                    : message.role === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-slate-100 text-slate-900 self-start'
                  }
                `}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.created_at && (
                  <p className={`text-xs mt-1 opacity-70`}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-900 self-start rounded-2xl px-3 py-2 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-500">Typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="border-t pt-4 mt-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !sessionId}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim() || !sessionId}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatBox;
