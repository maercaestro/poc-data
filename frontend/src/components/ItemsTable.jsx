const ItemsTable = () => {
  // Mock data for product detection results
  const mockItems = [
    { id: 1, name: "Premium Coffee Beans", brand: "Arabica Gold", confidence: "92%", status: "AI", price: "RM24.99", category: "Beverages" },
    { id: 2, name: "Organic Honey", brand: "Nature Pure", confidence: "85%", status: "Verified", price: "RM18.90", category: "Food" },
    { id: 3, name: "Green Tea Packets", brand: "Zen Garden", confidence: "67%", status: "Edited", price: "RM12.50", category: "Beverages" },
    { id: 4, name: "Chocolate Bars", brand: "Sweet Treats", confidence: "78%", status: "AI", price: "RM8.99", category: "Snacks" },
    { id: 5, name: "Vitamin Supplements", brand: "HealthMax", confidence: "91%", status: "Verified", price: "RM45.00", category: "Health" },
    { id: 6, name: "Protein Powder", brand: "FitLife", confidence: "73%", status: "Edited", price: "RM89.99", category: "Fitness" }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Edited': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'AI': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Beverages': 'bg-blue-50 text-blue-700 border-blue-200',
      'Food': 'bg-green-50 text-green-700 border-green-200',
      'Snacks': 'bg-orange-50 text-orange-700 border-orange-200',
      'Health': 'bg-purple-50 text-purple-700 border-purple-200',
      'Fitness': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#192A56' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#192A56' }}>Product Detection Results</h2>
              <p className="text-sm text-gray-500">AI-powered product analysis and annotations</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600">Total Products: </span>
              <span className="text-sm font-semibold" style={{ color: '#192A56' }}>{mockItems.length}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600">Verified: </span>
              <span className="text-sm font-semibold text-emerald-600">
                {mockItems.filter(item => item.status === 'Verified').length}
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600">Needs Review: </span>
              <span className="text-sm font-semibold text-amber-600">
                {mockItems.filter(item => item.status !== 'Verified').length}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockItems.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#50A6D1' }}
                    >
                      <span className="text-white font-medium text-sm">{item.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-semibold group-hover:text-gray-700" style={{ color: '#192A56' }}>{item.name}</div>
                      <div className="text-xs text-gray-500">Product #{item.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 whitespace-nowrap">
                  <div className="font-semibold" style={{ color: '#192A56' }}>{item.brand}</div>
                </td>
                <td className="px-6 py-6 whitespace-nowrap">
                  <div className="font-semibold" style={{ color: '#192A56' }}>{item.price}</div>
                </td>
                <td className="px-6 py-6 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-6 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium" style={{ color: '#192A56' }}>{item.confidence}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: item.confidence, 
                          backgroundColor: parseInt(item.confidence) > 80 ? '#10B981' : parseInt(item.confidence) > 60 ? '#F59E0B' : '#EF4444'
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{mockItems.length}</span> products detected
          </p>
          <button 
            className="px-4 py-2 rounded-md text-sm text-white transition-colors"
            style={{ backgroundColor: '#247BA0' }}
          >
            Start Annotation →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemsTable;
