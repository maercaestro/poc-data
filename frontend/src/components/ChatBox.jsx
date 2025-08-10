function ChatBox() {
  const cannedPrompts = [
    "What are the most popular items?",
    "Which items have the highest margin?", 
    "Show items by category",
    "What items should we promote?"
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-8 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-8">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#192A56' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#192A56' }}>AI Assistant</h2>
          <p className="text-sm text-gray-500">Ask questions about your menu data</p>
        </div>
      </div>
      
      {/* Chat Messages Area */}
      <div className="flex-1 bg-gray-50 rounded-xl p-6 mb-6 overflow-y-auto min-h-80 border border-gray-100">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#247BA0' }}
            >
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm border border-gray-100 max-w-xs">
              <p className="text-sm leading-relaxed" style={{ color: '#192A56' }}>
                Hello! I'm your menu analysis assistant. Upload your menu and sales data, then ask me anything about your restaurant's performance.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              Waiting for data upload...
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#192A56' }}>Quick Questions</h3>
        <div className="grid grid-cols-1 gap-2">
          {cannedPrompts.map((prompt, index) => (
            <button
              key={index}
              className="text-left text-sm bg-gray-50 hover:border-gray-200 border border-gray-100 rounded-lg p-3 transition-all duration-200 group"
              style={{ color: '#192A56' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#50A6D1';
                e.target.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#F9FAFB';
                e.target.style.color = '#192A56';
              }}
            >
              <div className="flex items-center justify-between">
                <span className="group-hover:text-white">{prompt}</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Ask me about your menu..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder-gray-400"
            style={{ 
              focusRingColor: '#247BA0'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#247BA0';
              e.target.style.boxShadow = `0 0 0 2px rgba(36, 123, 160, 0.1)`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <button 
          className="px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium text-white"
          style={{ backgroundColor: '#247BA0' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#50A6D1'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#247BA0'}
        >
          <span>Send</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
