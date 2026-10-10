import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext(null);

const initialState = {
  theme: 'dark', // 'dark' | 'light'

  // Financial Profile
  profile: {
    monthly_income: 60000,
    rent: 15000,
    food: 5000,
    transport: 3000,
    utilities: 4000,
    subscriptions: 1000,
    existing_emi: 12000,
    credit_card_payment: 8000,
    other_expenses: 0,
    savings: 50000,
  },

  // Custom User Added Bills
  customBills: [
    { id: '1', name: 'Electricity Bill', category: 'utilities', amount: 2500 },
    { id: '2', name: 'Wifi & Broadband', category: 'subscriptions', amount: 1200 },
    { id: '3', name: 'Health Insurance Premium', category: 'fixed', amount: 3500 },
  ],
};

// Compute initial other_expenses from initial customBills
initialState.profile.other_expenses = initialState.customBills.reduce(
  (sum, b) => sum + (parseFloat(b.amount) || 0),
  0
);

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_THEME': {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      return { ...state, theme: nextTheme };
    }
    case 'SET_THEME': {
      document.documentElement.setAttribute('data-theme', action.payload);
      return { ...state, theme: action.payload };
    }
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'ADD_BILL': {
      const bill = action.payload;
      const updatedBills = [bill, ...state.customBills];
      const newBillsTotal = updatedBills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
      return {
        ...state,
        customBills: updatedBills,
        profile: {
          ...state.profile,
          other_expenses: newBillsTotal,
        },
      };
    }
    case 'REMOVE_BILL': {
      const billId = action.payload;
      const updatedBills = state.customBills.filter(b => b.id !== billId);
      const newBillsTotal = updatedBills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
      return {
        ...state,
        customBills: updatedBills,
        profile: {
          ...state.profile,
          other_expenses: newBillsTotal,
        },
      };
    }
    case 'SET_CURRENT_LOAN':
      return { ...state, currentLoan: { ...state.currentLoan, ...action.payload } };
    case 'SET_COMPARE_LOAN':
      return { ...state, compareLoan: { ...state.compareLoan, ...action.payload } };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload };
    case 'SET_RISK':
      return { ...state, riskData: action.payload };
    case 'SET_SCENARIO':
      return { ...state, scenarioData: action.payload };
    case 'SET_COMPARISON':
      return { ...state, comparisonData: action.payload };
    case 'SET_EXPLANATION':
      return { ...state, explanation: action.payload };
    case 'SET_DOCUMENT':
      return { ...state, documentData: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
