import React, { useState } from 'react';

interface MobileSidebarToggleProps {
  children: React.ReactNode;
  quizTitle?: string;
}

const MobileSidebarToggle: React.FC<MobileSidebarToggleProps> = ({ 
  children, 
  quizTitle = 'Quiz' 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile Header - Only visible on mobile */}
      <div className="sm:hidden bg-white dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between relative z-50">
        <h1 className="text-lg font-semibold text-custom-dark-blue dark:text-white truncate">
          {quizTitle}
        </h1>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-custom-gray-1 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar with conditional transform */}
      <div 
        className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          sm:translate-x-0 transition-transform duration-300 ease-in-out
          fixed sm:static inset-y-0 left-0 z-40 w-80 sm:w-80
        `}
      >
        {children}
      </div>
    </>
  );
};

export default MobileSidebarToggle;
