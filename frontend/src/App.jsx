import React from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import FinancialProfile from './pages/FinancialProfile';
import Simulator from './pages/Simulator';
import Compare from './pages/Compare';
import AIInsights from './pages/AIInsights';
import { useApp } from './context/AppContext';

// Finance ticker data — adds visual trust/authenticity
const TICKER_ITEMS = [
  { label: 'SENSEX', value: '81,224', change: '+0.42%', up: true },
  { label: 'NIFTY 50', value: '24,834', change: '+0.38%', up: true },
  { label: 'REPO RATE', value: '6.50%', change: 'RBI', up: null },
  { label: 'USD/INR', value: '₹83.97', change: '-0.12%', up: false },
  { label: 'GOLD', value: '₹74,200/10g', change: '+0.65%', up: true },
  { label: 'INFLATION', value: '4.83%', change: 'CPI', up: null },
  { label: 'BANK NIFTY', value: '52,480', change: '+0.54%', up: true },
  { label: 'FD RATE', value: '7.25% p.a.', change: 'SBI', up: null },
];

function FinanceTicker() {
  return (
    <div className="finance-banner">
      {TICKER_ITEMS.map((item, i) => (
        <span key={i}>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {item.label}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
            {item.value}
          </span>
          {item.change && (
            <span
              className={item.up === true ? 'ticker-up' : item.up === false ? 'ticker-down' : ''}
              style={{ fontSize: '11px' }}
            >
              {item.change}
            </span>
          )}
          {i < TICKER_ITEMS.length - 1 && (
            <span style={{ color: 'var(--border-secondary)', marginLeft: '16px' }}>·</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const { state } = useApp();

  const renderTab = () => {
    switch (state.activeTab) {
      case 'dashboard':    return <Dashboard />;
      case 'input':        return <FinancialProfile />;
      case 'simulator':    return <Simulator />;
      case 'compare':      return <Compare />;
      case 'insights':     return <AIInsights />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <FinanceTicker />
      <main className="main-layout">{renderTab()}</main>
    </div>
  );
}
