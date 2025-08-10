import { useState } from 'react'
import Navbar from './components/Navbar'
import MainPage from './components/MainPage'
import DataAnnotationPage from './components/DataAnnotationPage'
import AgentDemoPage from './components/AgentDemoPage'
import ContactPage from './components/ContactPage'

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <MainPage />;
      case 'data':
        return <DataAnnotationPage />;
      case 'agent':
        return <AgentDemoPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <MainPage />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {/* Page Content */}
      {renderCurrentPage()}
      
      {/* Footer - Only show on non-home pages */}
      {currentPage !== 'home' && (
        <footer className="border-t border-gray-100 bg-white/80 backdrop-blur-sm mt-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                © 2025 CANTA. Built for restaurant analytics.
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Version 1.0.0</span>
                <span>•</span>
                <span>Status: <span style={{ color: '#247BA0' }} className="font-medium">Online</span></span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
