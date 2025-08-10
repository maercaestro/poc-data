function Navbar({ currentPage, onPageChange }) {
  const menuItems = [
    { id: 'home', label: 'Main Page', active: currentPage === 'home' },
    { id: 'data', label: 'Data Annotation', active: currentPage === 'data' },
    { id: 'agent', label: 'Agent Demo', active: currentPage === 'agent' },
    { id: 'contact', label: 'Contact Us', active: currentPage === 'contact' }
  ];

  return (
    <nav className="border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/Subtract.png" 
              alt="CANTA Logo" 
              className="w-30"
            />
          </div>
          
          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                  item.active
                    ? 'text-white shadow-lg'
                    : 'hover:text-white'
                }`}
                style={{
                  backgroundColor: item.active ? '#247BA0' : 'transparent',
                  color: item.active ? '#FFFFFF' : '#192A56',
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.target.style.backgroundColor = '#50A6D1';
                    e.target.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#192A56';
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              className="p-2 rounded-lg transition-all duration-200"
              style={{ color: '#192A56' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#50A6D1';
                e.target.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#192A56';
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
