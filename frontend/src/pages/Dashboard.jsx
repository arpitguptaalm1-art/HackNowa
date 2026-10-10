import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
  BarChart3,
  Sliders,
  PlusCircle,
  Trash2,
  Edit3,
  Sun,
  Moon,
  DollarSign,
  FilePlus,
  Lock,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { analyzeProfile, assessRisk, formatCurrency } from '../utils/calculations';

const COLORS = {
  accent: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#4a4a58',
};

function HealthGauge({ score, grade }) {
  const circumference = 2 * Math.PI * 75;
  const offset = circumference - (score / 100) * circumference;

  let color = COLORS.success;
  if (score < 35) color = COLORS.danger;
  else if (score < 50) color = COLORS.warning;
  else if (score < 65) color = '#f59e0b';
  else if (score < 80) color = COLORS.info;

  return (
    <div className="health-gauge">
      <div className="gauge-circle">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle className="gauge-bg" cx="90" cy="90" r="75" />
          <circle
            className="gauge-fill"
            cx="90" cy="90" r="75"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="gauge-text">
          <div className="gauge-value" style={{ color }}>{Math.round(score)}</div>
          <div className="gauge-label">{grade}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state, dispatch } = useApp();

  // State for manual inline bill addition
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillCategory, setNewBillCategory] = useState('utilities');

  // State for quick salary edit
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(state.profile.monthly_income);

  // State for quick EMI edit
  const [isEditingEMI, setIsEditingEMI] = useState(false);
  const [emiInput, setEmiInput] = useState(state.profile.existing_emi);

  // State for quick Rent / Commitments edit modal
  const [showEditCommitmentsModal, setShowEditCommitmentsModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    monthly_income: state.profile.monthly_income,
    existing_emi: state.profile.existing_emi,
    rent: state.profile.rent,
    credit_card_payment: state.profile.credit_card_payment,
    food: state.profile.food,
    transport: state.profile.transport,
    utilities: state.profile.utilities,
    savings: state.profile.savings,
  });

  const customBillsTotal = useMemo(() => {
    return state.customBills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  }, [state.customBills]);

  const effectiveProfile = useMemo(() => {
    return {
      ...state.profile,
      other_expenses: customBillsTotal,
    };
  }, [state.profile, customBillsTotal]);

  const analysis = useMemo(() => analyzeProfile(effectiveProfile), [effectiveProfile]);
  const risk = useMemo(
    () => assessRisk(analysis, state.currentLoan),
    [analysis, state.currentLoan]
  );

  const handleSalarySave = () => {
    const val = Math.max(0, parseFloat(salaryInput) || 0);
    dispatch({ type: 'SET_PROFILE', payload: { monthly_income: val } });
    setIsEditingSalary(false);
  };

  const handleEMISave = () => {
    const val = Math.max(0, parseFloat(emiInput) || 0);
    dispatch({ type: 'SET_PROFILE', payload: { existing_emi: val } });
    setIsEditingEMI(false);
  };

  const handleOpenEditModal = () => {
    setEditProfileForm({
      monthly_income: state.profile.monthly_income,
      existing_emi: state.profile.existing_emi,
      rent: state.profile.rent,
      credit_card_payment: state.profile.credit_card_payment,
      food: state.profile.food,
      transport: state.profile.transport,
      utilities: state.profile.utilities,
      savings: state.profile.savings,
    });
    setShowEditCommitmentsModal(true);
  };

  const handleSaveCommitmentsModal = (e) => {
    e.preventDefault();
    dispatch({
      type: 'SET_PROFILE',
      payload: {
        monthly_income: Math.max(0, parseFloat(editProfileForm.monthly_income) || 0),
        existing_emi: Math.max(0, parseFloat(editProfileForm.existing_emi) || 0),
        rent: Math.max(0, parseFloat(editProfileForm.rent) || 0),
        credit_card_payment: Math.max(0, parseFloat(editProfileForm.credit_card_payment) || 0),
        food: Math.max(0, parseFloat(editProfileForm.food) || 0),
        transport: Math.max(0, parseFloat(editProfileForm.transport) || 0),
        utilities: Math.max(0, parseFloat(editProfileForm.utilities) || 0),
        savings: Math.max(0, parseFloat(editProfileForm.savings) || 0),
      },
    });
    setShowEditCommitmentsModal(false);
  };

  const handleAddBill = (e) => {
    e.preventDefault();
    if (!newBillName || !newBillAmount) return;

    const amt = Math.max(0, parseFloat(newBillAmount) || 0);
    const billObj = {
      id: Date.now().toString(),
      name: newBillName,
      category: newBillCategory,
      amount: amt,
    };

    dispatch({ type: 'ADD_BILL', payload: billObj });
    setNewBillName('');
    setNewBillAmount('');
    setShowAddBillModal(false);
  };

  const handleRemoveBill = (id) => {
    dispatch({ type: 'REMOVE_BILL', payload: id });
  };

  const incomeExpenseData = [
    { name: 'Income', value: analysis.income.monthly_income, fill: COLORS.success },
    { name: 'Fixed', value: analysis.expenses.total_fixed, fill: COLORS.info },
    { name: 'Variable', value: analysis.expenses.total_variable, fill: COLORS.warning },
    { name: 'Debt', value: analysis.debt.total_debt_payments, fill: COLORS.danger },
    { name: 'Surplus', value: Math.max(0, analysis.cash_flow.monthly_surplus), fill: COLORS.accent },
  ];

  const expenseBreakdown = [
    { name: 'Rent', value: effectiveProfile.rent, fill: '#6366f1' },
    { name: 'Food', value: effectiveProfile.food, fill: '#10b981' },
    { name: 'Transport', value: effectiveProfile.transport, fill: '#3b82f6' },
    { name: 'Utilities', value: effectiveProfile.utilities, fill: '#f59e0b' },
    { name: 'EMI', value: effectiveProfile.existing_emi, fill: '#ef4444' },
    { name: 'Credit Card', value: effectiveProfile.credit_card_payment, fill: '#ec4899' },
    { name: 'Subscriptions', value: effectiveProfile.subscriptions, fill: '#8b5cf6' },
    { name: 'Active Custom Bills', value: customBillsTotal, fill: '#06b6d4' },
  ].filter(d => d.value > 0);

  const healthData = [
    { subject: 'Income', value: analysis.health_scores.income_stability },
    { subject: 'Expenses', value: analysis.health_scores.expense_load },
    { subject: 'Debt', value: analysis.health_scores.debt_load },
    { subject: 'Savings', value: analysis.health_scores.savings_capacity },
    { subject: 'Emergency', value: analysis.health_scores.emergency_buffer },
  ];

  const surplus = analysis.cash_flow.monthly_surplus;
  const surplusColor = surplus >= 10000 ? 'success' : surplus >= 5000 ? 'warning' : 'danger';

  const getRiskIcon = (level) => {
    switch (level) {
      case 'Low': return <CheckCircle size={16} />;
      case 'Medium': return <Info size={16} />;
      case 'High': return <AlertTriangle size={16} />;
      case 'Critical': return <AlertTriangle size={16} />;
      default: return <Info size={16} />;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-secondary)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label || payload[0].name}</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(payload[0].value)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="main-content">
      {/* Decent Header with Theme Toggle Action */}
      <div className="section-header" style={{ marginBottom: '24px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className="section-title">Financial Dashboard</h1>
            <span className="badge badge-accent" style={{ fontSize: '11px' }}>
              Bank-Grade Encryption Verified
            </span>
          </div>
          <p className="section-subtitle">
            Real-time financial health, cash flow analytics, and active bill management.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Light/White Theme Toggle Button */}
          <button
            className="btn btn-secondary"
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            style={{ fontWeight: 600 }}
          >
            {state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {state.theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddBillModal(true)}
          >
            <PlusCircle size={16} /> Add Custom Bill / Payment
          </button>
        </div>
      </div>

      {/* Interactive Quick-Edit Bar */}
      <div
        className="card"
        style={{
          marginBottom: '28px',
          padding: '20px 24px',
          background: 'var(--gradient-card)',
          border: '1px solid var(--border-accent)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Salary Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-icon accent">
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Monthly Net Salary / Income
              </div>
              {isEditingSalary ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '150px', padding: '4px 10px', fontSize: '14px' }}
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    autoFocus
                  />
                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleSalarySave}>
                    <Check size={14} /> Save
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {formatCurrency(state.profile.monthly_income)}
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={() => { setSalaryInput(state.profile.monthly_income); setIsEditingSalary(true); }}
                  >
                    <Edit3 size={11} /> Edit Salary
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Commitments & Bills Quick Edit Items */}
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Fixed Debt EMIs */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fixed Debt EMIs</div>
              {isEditingEMI ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '120px', padding: '4px 8px', fontSize: '13px' }}
                    value={emiInput}
                    onChange={(e) => setEmiInput(e.target.value)}
                    autoFocus
                  />
                  <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleEMISave}>
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--danger-light)' }}>
                    {formatCurrency(state.profile.existing_emi)}
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                    title="Edit Fixed Debt EMI"
                    onClick={() => { setEmiInput(state.profile.existing_emi); setIsEditingEMI(true); }}
                  >
                    <Edit3 size={10} /> Edit EMI
                  </button>
                </div>
              )}
            </div>

            <div style={{ height: '30px', width: '1px', background: 'var(--border-secondary)' }} />

            {/* Active Bills Count */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Active Bills</div>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-light)' }}>
                {state.customBills.length} Item(s)
              </div>
            </div>

            <div style={{ height: '30px', width: '1px', background: 'var(--border-secondary)' }} />

            {/* Comprehensive Edit Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ fontSize: '13px' }} onClick={handleOpenEditModal}>
                <Sliders size={14} /> Edit All Values
              </button>
              <button className="btn btn-primary" style={{ fontSize: '13px' }} onClick={() => setShowAddBillModal(true)}>
                <FilePlus size={14} /> Manage Bills
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Editing All Financial Commitments / Values */}
      {showEditCommitmentsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-secondary)',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="card-title" style={{ fontSize: '18px', margin: 0 }}>
                <Sliders size={20} style={{ color: 'var(--accent)' }} /> Edit Financial Commitments & Income
              </h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => setShowEditCommitmentsModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCommitmentsModal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Monthly Income (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editProfileForm.monthly_income}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, monthly_income: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Fixed Debt EMIs (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editProfileForm.existing_emi}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, existing_emi: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">House Rent (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editProfileForm.rent}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, rent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Credit Card Payments (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editProfileForm.credit_card_payment}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, credit_card_payment: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Food & Household (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editProfileForm.food}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, food: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Utilities & Subscriptions (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editProfileForm.utilities}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, utilities: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Total Liquid Savings / Cash Reserves (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editProfileForm.savings}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, savings: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditCommitmentsModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Save & Recalculate Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Adding Custom Bills */}
      {showAddBillModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              boxShadow: 'var(--shadow-lg)',
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Add Custom Bill or Payment</h3>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setShowAddBillModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBill} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Bill / Payment Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Broadband, Medical Insurance, Water Bill"
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 2500"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={newBillCategory}
                  onChange={(e) => setNewBillCategory(e.target.value)}
                >
                  <option value="utilities">Utilities & Bills</option>
                  <option value="subscriptions">Subscriptions & Digital</option>
                  <option value="fixed">Fixed Obligation</option>
                  <option value="other_expenses">Other Miscellaneous</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddBillModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Add to Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="stats-grid stagger" style={{ marginBottom: '28px' }}>
        <div className="stat-card accent">
          <div className="stat-label">Monthly Take-Home Salary</div>
          <div className="stat-value">{formatCurrency(analysis.income.monthly_income)}</div>
          <div className="stat-change positive">
            <TrendingUp size={12} /> Active Inflow
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Total Outflow & Expenses</div>
          <div className="stat-value">{formatCurrency(analysis.expenses.total_expenses)}</div>
          <div className="stat-change negative">
            <ArrowUpRight size={12} /> {analysis.ratios.expense_to_income}% of salary
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-label">Total Monthly Debt Service</div>
          <div className="stat-value">{formatCurrency(analysis.debt.total_debt_payments)}</div>
          <div className="stat-change negative">
            <CreditCard size={12} /> DTI Ratio: {analysis.ratios.debt_to_income}%
          </div>
        </div>

        <div className={`stat-card ${surplusColor}`}>
          <div className="stat-label">Net Unallocated Surplus</div>
          <div className={`stat-value ${surplusColor}`}>
            {formatCurrency(surplus)}
          </div>
          <div className={`stat-change ${surplus > 0 ? 'positive' : 'negative'}`}>
            {surplus > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {analysis.ratios.savings_rate}% savings margin
          </div>
        </div>
      </div>

      {/* Active User Bills List Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} className="text-accent" /> Active Monthly Bills & Payments Manager
          </h3>
          <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setShowAddBillModal(true)}>
            <PlusCircle size={14} /> Add Bill
          </button>
        </div>

        {state.customBills.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            No custom bills added yet. Click "+ Add Custom Bill" above to add recurring payments.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {state.customBills.map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                    Category: {b.category}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-light)' }}>
                    {formatCurrency(b.amount)}
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.8 }}
                    onClick={() => handleRemoveBill(b.id)}
                    title="Remove bill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Visual Charts Grid */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Income vs Expenses Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart3 size={18} />
              Cash Flow Allocation
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={incomeExpenseData} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {incomeExpenseData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown Donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Wallet size={18} />
              Monthly Expense Distribution
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="55%" height={260}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {expenseBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, fontSize: '12px' }}>
              {expenseBreakdown.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 0',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    background: item.fill,
                    flexShrink: 0,
                  }} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Health Score + Risk Indicators */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Health Score */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} />
              Financial Health Rating
            </div>
            <span className={`badge badge-${
              analysis.health_scores.overall >= 65 ? 'success' :
              analysis.health_scores.overall >= 50 ? 'warning' : 'danger'
            }`}>
              {analysis.health_scores.grade}
            </span>
          </div>

          <HealthGauge
            score={analysis.health_scores.overall}
            grade={analysis.health_scores.grade}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Income Stability', value: analysis.health_scores.income_stability },
              { label: 'Expense Load', value: analysis.health_scores.expense_load },
              { label: 'Debt Load', value: analysis.health_scores.debt_load },
              { label: 'Savings Capacity', value: analysis.health_scores.savings_capacity },
              { label: 'Emergency Buffer', value: analysis.health_scores.emergency_buffer },
            ].map((item, i) => {
              const barColor = item.value >= 70 ? 'success' : item.value >= 40 ? 'warning' : 'danger';
              return (
                <div key={i}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: '12px',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                      {Math.round(item.value)}/100
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${barColor}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Indicators */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Shield size={18} />
              Risk Diagnostics
            </div>
            <span className={`badge badge-${
              risk.risk_level === 'Low' ? 'success' :
              risk.risk_level === 'Medium' ? 'warning' : 'danger'
            }`}>
              Risk: {risk.risk_level}
            </span>
          </div>

          <div>
            {risk.indicators.map((indicator, i) => (
              <div className="risk-indicator" key={i}>
                <div className={`risk-icon ${indicator.level.toLowerCase()}`}>
                  {getRiskIcon(indicator.level)}
                </div>
                <div className="risk-content">
                  <div className="risk-name">
                    {indicator.name}
                    <span className={`badge badge-${
                      indicator.level === 'Low' ? 'success' :
                      indicator.level === 'Medium' ? 'warning' : 'danger'
                    }`}>
                      {indicator.level}
                    </span>
                  </div>
                  <div className="risk-detail">{indicator.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Navigation Action Footer */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '32px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-secondary)',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
          Ready to test a proposed loan decision?
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Simulate how taking a new loan will impact your monthly budget, emergency runway, and stress resilience.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => dispatch({ type: 'SET_TAB', payload: 'simulator' })}
          >
            <Sliders size={18} /> Open Decision Simulator
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => dispatch({ type: 'SET_TAB', payload: 'insights' })}
          >
            View AI Insights Report
          </button>
        </div>
      </div>
    </div>
  );
}
