import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Sliders,
  GitCompare,
  Sparkles,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { state, dispatch } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'input', label: 'Financial Profile', icon: FileText },
    { id: 'simulator', label: 'Simulator', icon: Sliders },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">
          <Shield size={20} />
        </div>
        <div>
          <div className="navbar-title">ArthIQ</div>
          <div className="navbar-subtitle">Financial Risk Engine</div>
        </div>
      </div>

      <div className="navbar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-link ${state.activeTab === item.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', payload: item.id })}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}

        {/* Light / Dark Mode Toggle Button */}
        <button
          className="nav-link theme-toggle-btn"
          onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
          title={`Switch to ${state.theme === 'dark' ? 'White/Light' : 'Dark'} Theme`}
          style={{
            marginLeft: '12px',
            background: state.theme === 'light' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255,255,255,0.06)',
            color: state.theme === 'light' ? 'var(--accent)' : '#f59e0b',
            border: '1px solid var(--border-secondary)',
            borderRadius: '20px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {state.theme === 'dark' ? (
            <>
              <Sun size={15} /> Light Theme
            </>
          ) : (
            <>
              <Moon size={15} /> Dark Theme
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
