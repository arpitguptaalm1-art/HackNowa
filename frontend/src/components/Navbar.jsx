import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Sliders,
  GitCompare,
  Sparkles,
  Shield,
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
          <Shield size={18} />
        </div>
        <div>
          <div className="navbar-title">ArthIQ</div>
          <div className="navbar-subtitle">Financial Intelligence</div>
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
      </div>
    </nav>
  );
}
