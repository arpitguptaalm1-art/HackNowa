import React from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import FinancialProfile from './pages/FinancialProfile';
import Simulator from './pages/Simulator';
import Compare from './pages/Compare';
import AIInsights from './pages/AIInsights';
import { useApp } from './context/AppContext';

export default function App() {
  const { state } = useApp();

  const renderTab = () => {
    switch (state.activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'input':
        return <FinancialProfile />;
      case 'simulator':
        return <Simulator />;
      case 'compare':
        return <Compare />;
      case 'insights':
        return <AIInsights />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-layout">{renderTab()}</main>
    </div>
  );
}
