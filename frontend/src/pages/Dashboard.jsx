import React, { useMemo } from 'react';
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

  const analysis = useMemo(() => analyzeProfile(state.profile), [state.profile]);
  const risk = useMemo(
    () => assessRisk(analysis, state.currentLoan),
    [analysis, state.currentLoan]
  );

  const incomeExpenseData = [
    { name: 'Income', value: analysis.income.monthly_income, fill: COLORS.success },
    { name: 'Fixed', value: analysis.expenses.total_fixed, fill: COLORS.info },
    { name: 'Variable', value: analysis.expenses.total_variable, fill: COLORS.warning },
    { name: 'Debt', value: analysis.debt.total_debt_payments, fill: COLORS.danger },
    { name: 'Surplus', value: Math.max(0, analysis.cash_flow.monthly_surplus), fill: COLORS.accent },
  ];

  const expenseBreakdown = [
    { name: 'Rent', value: state.profile.rent, fill: '#6366f1' },
    { name: 'Food', value: state.profile.food, fill: '#10b981' },
    { name: 'Transport', value: state.profile.transport, fill: '#3b82f6' },
    { name: 'Utilities', value: state.profile.utilities, fill: '#f59e0b' },
    { name: 'EMI', value: state.profile.existing_emi, fill: '#ef4444' },
    { name: 'Credit Card', value: state.profile.credit_card_payment, fill: '#ec4899' },
    { name: 'Subscriptions', value: state.profile.subscriptions, fill: '#8b5cf6' },
    { name: 'Other', value: state.profile.other_expenses, fill: '#64748b' },
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
          background: 'rgba(22, 22, 32, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
        }}>
          <div style={{ color: '#9898a8', marginBottom: '4px' }}>{label || payload[0].name}</div>
          <div style={{ color: '#f0f0f5', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            {formatCurrency(payload[0].value)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="main-content">
      {/* Section Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h1 className="section-title">Financial Dashboard</h1>
        <p className="section-subtitle">
          Real-time analysis of your financial health and risk indicators
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger">
        <div className="stat-card accent">
          <div className="stat-label">Monthly Income</div>
          <div className="stat-value">{formatCurrency(analysis.income.monthly_income)}</div>
          <div className="stat-change positive">
            <TrendingUp size={12} /> Stable
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{formatCurrency(analysis.expenses.total_expenses)}</div>
          <div className="stat-change negative">
            <ArrowUpRight size={12} /> {analysis.ratios.expense_to_income}% of income
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-label">Debt Payments</div>
          <div className="stat-value">{formatCurrency(analysis.debt.total_debt_payments)}</div>
          <div className="stat-change negative">
            <CreditCard size={12} /> DTI: {analysis.ratios.debt_to_income}%
          </div>
        </div>

        <div className={`stat-card ${surplusColor}`}>
          <div className="stat-label">Monthly Surplus</div>
          <div className={`stat-value ${surplusColor}`}>
            {formatCurrency(surplus)}
          </div>
          <div className={`stat-change ${surplus > 0 ? 'positive' : 'negative'}`}>
            {surplus > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {analysis.ratios.savings_rate}% savings rate
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Income vs Expenses Chart */}
        <div className="card animate-fadeInUp">
          <div className="card-header">
            <div className="card-title">
              <BarChart3 size={18} />
              Cash Flow Breakdown
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={incomeExpenseData} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b6b7b', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b6b7b', fontSize: 11 }}
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

        {/* Expense Breakdown Pie */}
        <div className="card animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <div className="card-title">
              <Wallet size={18} />
              Expense Breakdown
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
                    color: '#9898a8',
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
                  <span style={{ fontFamily: "'JetBrains Mono'", color: '#f0f0f5', fontWeight: 500 }}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Health Score + Risk Indicators */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Health Score */}
        <div className="card animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} />
              Financial Health Score
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

          {/* Health breakdown bars */}
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
                    <span style={{ color: '#9898a8' }}>{item.label}</span>
                    <span style={{ color: '#f0f0f5', fontFamily: "'JetBrains Mono'", fontWeight: 500 }}>
                      {Math.round(item.value)}
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
        <div className="card animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <div className="card-header">
            <div className="card-title">
              <Shield size={18} />
              Risk Indicators
            </div>
            <span className={`badge badge-${
              risk.risk_level === 'Low' ? 'success' :
              risk.risk_level === 'Medium' ? 'warning' :
              risk.risk_level === 'High' ? 'danger' : 'danger'
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

          {/* Risk Signals */}
          {risk.signals.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#9898a8', marginBottom: '8px' }}>
                Loan Impact Signals
              </div>
              {risk.signals.map((signal, i) => (
                <div className={`insight-item`} key={i}>
                  <div className={`insight-icon ${
                    signal.type === 'danger' ? 'danger' :
                    signal.type === 'warning' ? 'warning' : 'success'
                  }`}>
                    {signal.type === 'positive' ? '✓' : '⚠'}
                  </div>
                  <div className="insight-text">{signal.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Financial Health Radar */}
      <div className="card animate-fadeInUp" style={{ animationDelay: '400ms' }}>
        <div className="card-header">
          <div className="card-title">
            <Activity size={18} />
            Financial Profile Radar
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={healthData}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6b6b7b', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#4a4a58', fontSize: 10 }}
            />
            <Radar
              name="Health"
              dataKey="value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Action */}
      <div style={{
        textAlign: 'center',
        padding: '32px 0',
        marginTop: '16px',
      }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => dispatch({ type: 'SET_TAB', payload: 'simulator' })}
        >
          <Sliders size={18} />
          Open Scenario Simulator
        </button>
      </div>
    </div>
  );
}
