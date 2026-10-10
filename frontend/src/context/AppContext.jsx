import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const initialState = {
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

  // Loan being considered
  currentLoan: {
    loan_amount: 500000,
    interest_rate: 12,
    tenure_years: 5,
    processing_fee: 5000,
    label: 'Loan A',
  },

  // Compare loan
  compareLoan: {
    loan_amount: 500000,
    interest_rate: 13,
    tenure_years: 4,
    processing_fee: 2000,
    label: 'Loan B',
  },

  // Analysis results
  analysis: null,
  riskData: null,
  scenarioData: null,
  comparisonData: null,
  explanation: null,

  // Document data
  documentData: null,

  // UI state
  isLoading: false,
  activeTab: 'dashboard',
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
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
