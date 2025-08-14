import ChatBox from './ChatBox'
import { useState, useEffect } from 'react'

function AgentDemoPage() {
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [hasMenuData, setHasMenuData] = useState(false);

  // Check for menu data on component mount
  useEffect(() => {
    const storedData = localStorage.getItem('agentData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setMenuData(data);
        setHasMenuData(true);
      } catch (e) {
        console.error('Failed to parse stored menu data:', e);
        setHasMenuData(false);
      }
    } else {
      setHasMenuData(false);
    }
  }, []);

  // Pass query to ChatBox
  const handleQueryClick = (query) => {
    setSelectedQuery(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#192A56' }}>
            CANTA Restaurant Server
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Welcome to our restaurant! Our AI server is here to help you discover the perfect meal 
            from our menu and make your dining experience memorable.
          </p>
        </div>

        {!hasMenuData ? (
          // No Menu Data - Show Instructions
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Menu Not Loaded</h3>
              <p className="text-gray-600 mb-6">
                Our AI server needs to know what's on the menu before helping you order! 
                Please upload and process a menu image in the Data Annotation page first.
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <span className="font-medium">Go to Data Annotation page</span>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <span className="font-medium">Upload a menu image</span>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <span className="font-medium">Click "Pass to Agent"</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <span className="font-medium">Return here to start ordering!</span>
                  </div>
                </div>
                <button
                  onClick={() => window.location.hash = '#data'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Go to Data Annotation
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Menu Data Available - Show Restaurant Interface
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Chat Box - Takes up 3 columns */}
            <div className="lg:col-span-3">
              <ChatBox selectedQuery={selectedQuery} onQueryProcessed={() => setSelectedQuery(null)} />
            </div>

            {/* Menu Summary Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Menu</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Items</span>
                    <span className="font-semibold text-gray-900">{menuData?.items?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Menu Source</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{menuData?.source || 'AI Detected'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-xs text-gray-500">
                      {menuData?.timestamp ? new Date(menuData.timestamp).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Capabilities</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Menu Recommendations</p>
                      <p className="text-xs text-gray-600">Suggest the best items for you</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dietary Assistance</p>
                      <p className="text-xs text-gray-600">Help with allergies and preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Taking</p>
                      <p className="text-xs text-gray-600">Process your complete order</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Food Knowledge</p>
                      <p className="text-xs text-gray-600">Ingredients and preparation details</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentDemoPage;
