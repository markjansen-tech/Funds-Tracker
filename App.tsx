
import React, { useState } from 'react';
import ExpenseTracker from './components/ExpenseTracker';
import FDManager from './components/FDManager';

enum Tab {
  EXPENSES = 'expenses',
  FD_PORTFOLIO = 'fd_portfolio'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.EXPENSES);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 z-50 flex-none">
        <div className="max-w-7xl mx-auto px-4 flex justify-center sm:justify-start">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab(Tab.EXPENSES)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === Tab.EXPENSES
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Family Expenses
            </button>
            <button
              onClick={() => setActiveTab(Tab.FD_PORTFOLIO)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === Tab.FD_PORTFOLIO
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              FD Portfolio
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === Tab.EXPENSES ? (
          <ExpenseTracker />
        ) : (
          <FDManager />
        )}
      </div>
    </div>
  );
};

export default App;
