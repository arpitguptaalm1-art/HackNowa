import React, { useState, useMemo } from 'react';
import {
  Sliders,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Shield,
  RefreshCw,
  ArrowRight,
  Zap,
  Activity,
  Calendar,
  Percent,
  DollarSign
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { calculateEMI, calculateTotalInterest, analyzeProfile, assessRisk, formatCurrency } from '../utils/calculations';

export default function Simulator() {
  const { state, dispatch } = useApp();

  const [loanAmount, setLoanAmount] = useState(state.currentLoan.loan_amount || 500000);
  const [interestRate, setInterestRate] = useState(state.currentLoan.interest_rate || 13);
  const [tenureYears, setTenureYears] = useState(state.currentLoan.tenure_years || 5);

  // Stress tests
  const [salaryCut, setSalaryCut] = useState(0); // percentage
  const [expenseInflation, setExpenseInflation] = useState(0); // percentage
  const [jobLossMonths, setJobLossMonths] = useState(0); // months with 0 salary

  // Calculated EMI
  const newEmi = useMemo(() => calculateEMI(loanAmount, interestRate, tenureYears), [
    loanAmount,
    interestRate,
    tenureYears,
  ]);

  const totalInterest = useMemo(
    () => calculateTotalInterest(loanAmount, newEmi, tenureYears),
    [loanAmount, newEmi, tenureYears]
  );

  // Synchronize Custom Bills Total
  const customBillsTotal = useMemo(() => {
    if (!state.customBills) return state.profile.other_expenses || 0;
    return state.customBills.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
  }, [state.customBills, state.profile.other_expenses]);

  // Base profile with accurate custom bills
  const effectiveBaseProfile = useMemo(() => {
    return {
      ...state.profile,
      other_expenses: customBillsTotal,
    };
  }, [state.profile, customBillsTotal]);

  // Stressed profile calculation
  const stressedProfile = useMemo(() => {
    const origIncome = parseFloat(state.profile.monthly_income) || 0;
    const effectiveIncome = jobLossMonths > 0 ? 0 : origIncome * (1 - salaryCut / 100);
    const foodVal = (parseFloat(state.profile.food) || 0) * (1 + expenseInflation / 100);
    const transportVal = (parseFloat(state.profile.transport) || 0) * (1 + expenseInflation / 100);

    return {
      ...state.profile,
      monthly_income: Math.max(0, effectiveIncome),
      food: foodVal,
      transport: transportVal,
      other_expenses: customBillsTotal,
    };
  }, [state.profile, customBillsTotal, salaryCut, expenseInflation, jobLossMonths]);

  // Baseline Risk (without new loan)
  const baseAnalysis = useMemo(() => analyzeProfile(effectiveBaseProfile), [effectiveBaseProfile]);
  const baseRisk = useMemo(() => assessRisk(baseAnalysis, null), [baseAnalysis]);

  // Stressed Risk with New Loan
  const simulatedLoan = useMemo(() => ({
    loan_amount: loanAmount,
    interest_rate: interestRate,
    tenure_years: tenureYears,
    label: 'Simulated Loan',
  }), [loanAmount, interestRate, tenureYears]);

  const stressedAnalysis = useMemo(() => analyzeProfile(stressedProfile), [stressedProfile]);
  const simulatedRisk = useMemo(() => assessRisk(stressedAnalysis, simulatedLoan), [
    stressedAnalysis,
    simulatedLoan,
  ]);

  // Save changes to global state
  const handleSaveToGlobal = () => {
    dispatch({
      type: 'SET_CURRENT_LOAN',
      payload: simulatedLoan,
    });
    dispatch({ type: 'SET_TAB', payload: 'insights' });
  };

  const resetStressTests = () => {
    setSalaryCut(0);
    setExpenseInflation(0);
    setJobLossMonths(0);
  };

  // Buffer projections chart data (over 12 months)
  const projectionData = useMemo(() => {
    const data = [];
    let currentSavings = parseFloat(state.profile.savings) || 0;
    const monthlySurplus = (stressedAnalysis.cash_flow.monthly_surplus || 0) - (newEmi || 0);

    for (let m = 1; m <= 12; m++) {
      currentSavings += monthlySurplus;
      data.push({
        month: `Month ${m}`,
        savings: Math.max(0, Math.round(currentSavings)),
        surplus: Math.round(monthlySurplus),
      });
    }
    return data;
  }, [state.profile.savings, stressedAnalysis.cash_flow.monthly_surplus, newEmi]);

  const riskBadgeClass = (level) => {
    switch (level) {
      case 'Low': return 'badge-success';
      case 'Medium': return 'badge-info';
      case 'High': return 'badge-warning';
      case 'Critical': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="section-title">Loan Decision & Stress Simulator</h1>
          <p className="section-subtitle">
            Simulate taking a new loan and stress-test your finances against salary cuts, job loss, and inflation.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveToGlobal}>
          Generate AI Decision Report <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid grid-2" style={{ gap: '24px', marginBottom: '28px' }}>
        {/* Left Column: Loan Parameters & Controls */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} className="text-accent" /> Loan Proposal Parameters
            </h3>
            <span className="badge badge-accent">Interactive Controls</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Loan Amount Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Loan Amount (Principal)</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-light)' }}>
                  {formatCurrency(loanAmount)}
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="5000000"
                step="25000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 50000)}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                <span>₹50,000</span>
                <span>₹25,00,000</span>
                <span>₹50,00,000</span>
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Annual Interest Rate (%)</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-light)' }}>
                  {interestRate}%
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="24"
                step="0.25"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 6)}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                <span>6% (Home)</span>
                <span>13% (Personal)</span>
                <span>24% (High Risk)</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Loan Tenure (Years)</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-light)' }}>
                  {tenureYears} Years ({tenureYears * 12} months)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={tenureYears}
                onChange={(e) => setTenureYears(parseInt(e.target.value) || 1)}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                <span>1 Year</span>
                <span>5 Years</span>
                <span>30 Years</span>
              </div>
            </div>

            {/* Output EMI Card */}
            <div className="stat-card accent" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-label">New Monthly EMI</div>
                  <div className="stat-value" style={{ fontSize: '28px', color: 'var(--accent-light)' }}>
                    {formatCurrency(newEmi)}/mo
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stat-label">Total Interest Paid</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(totalInterest)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stress Testing Controls */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'var(--warning)' }} /> Stress Testing Engine
            </h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={resetStressTests}>
              <RefreshCw size={12} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Salary Cut Stress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Salary / Income Reduction</label>
                <span className="badge badge-warning">-{salaryCut}% Income</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={salaryCut}
                onChange={(e) => setSalaryCut(parseInt(e.target.value) || 0)}
                style={{ width: '100%', accentColor: 'var(--warning)' }}
              />
            </div>

            {/* Expense Inflation Stress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Living Expense Inflation</label>
                <span className="badge badge-warning">+{expenseInflation}% Costs</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={expenseInflation}
                onChange={(e) => setExpenseInflation(parseInt(e.target.value) || 0)}
                style={{ width: '100%', accentColor: 'var(--warning)' }}
              />
            </div>

            {/* Job Loss Shock */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Job Loss Duration (0 Salary)</label>
                <span className="badge badge-danger">{jobLossMonths} Months Unemployment</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={jobLossMonths}
                onChange={(e) => setJobLossMonths(parseInt(e.target.value) || 0)}
                style={{ width: '100%', accentColor: 'var(--danger)' }}
              />
            </div>

            {/* Quick Stress Presets */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '12px' }}
                onClick={() => { setSalaryCut(20); setExpenseInflation(10); setJobLossMonths(0); }}
              >
                Mild Recession
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '12px' }}
                onClick={() => { setSalaryCut(0); setExpenseInflation(0); setJobLossMonths(3); }}
              >
                3-Mo Job Loss
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Assessment Comparison Cards */}
      <div className="grid grid-3" style={{ gap: '20px', marginBottom: '28px' }}>
        {/* Baseline Risk vs Simulated Risk */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Risk Score Impact</h4>
            <span className={`badge ${riskBadgeClass(simulatedRisk.risk_level)}`}>
              {simulatedRisk.risk_level} Risk
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Baseline Score</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{Math.round(baseRisk.risk_score || 0)}</div>
            </div>
            <div style={{ fontSize: '20px', color: 'var(--text-tertiary)' }}>→</div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Post-Loan Score</div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: simulatedRisk.risk_score > 65 ? 'var(--danger)' : simulatedRisk.risk_score > 40 ? 'var(--warning)' : 'var(--success)',
                }}
              >
                {Math.round(simulatedRisk.risk_score || 0)}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Taking this EMI increases your total DTI ratio from {baseAnalysis.ratios.debt_to_income}% to{' '}
            {effectiveBaseProfile.monthly_income > 0
              ? Math.round(((baseAnalysis.debt.total_debt_payments + newEmi) / effectiveBaseProfile.monthly_income) * 100)
              : 100}%.
          </p>
        </div>

        {/* Monthly Surplus Impact */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Net Surplus Impact</h4>
            <span
              className={`badge ${
                baseAnalysis.cash_flow.monthly_surplus - newEmi >= 0 ? 'badge-success' : 'badge-danger'
              }`}
            >
              {baseAnalysis.cash_flow.monthly_surplus - newEmi >= 0 ? 'Positive Cash Flow' : 'Deficit Cash Flow'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Current Surplus</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(baseAnalysis.cash_flow.monthly_surplus)}
              </div>
            </div>
            <div style={{ fontSize: '20px', color: 'var(--text-tertiary)' }}>→</div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Post-EMI Surplus</div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: baseAnalysis.cash_flow.monthly_surplus - newEmi >= 0 ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {formatCurrency(baseAnalysis.cash_flow.monthly_surplus - newEmi)}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            You will retain{' '}
            {effectiveBaseProfile.monthly_income > 0
              ? Math.max(
                  0,
                  Math.round(((baseAnalysis.cash_flow.monthly_surplus - newEmi) / effectiveBaseProfile.monthly_income) * 100)
                )
              : 0}
            % of your salary after all EMIs and living expenses.
          </p>
        </div>

        {/* Emergency Runway */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Emergency Runway</h4>
            <span className="badge badge-info">Savings Buffer</span>
          </div>
          <div style={{ margin: '16px 0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--info-light)' }}>
              {(baseAnalysis.expenses.total_expenses + newEmi) > 0
                ? Math.max(0, parseFloat((state.profile.savings / (baseAnalysis.expenses.total_expenses + newEmi)).toFixed(1))).toFixed(1)
                : '12.0'} Months
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Time before liquid savings ({formatCurrency(state.profile.savings)}) deplete if income stops completely.
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Recommended minimum buffer: <strong>6.0 Months</strong>.
          </div>
        </div>
      </div>

      {/* 12-Month Projection Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">12-Month Savings Trajectory Under Simulated Conditions</h3>
          <span className="badge badge-neutral">Cashflow Projection</span>
        </div>
        <div style={{ height: '300px', width: '100%', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#6b6b7b" />
              <YAxis stroke="#6b6b7b" tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(22, 22, 32, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                formatter={(val) => formatCurrency(val)}
              />
              <Legend />
              <Line type="monotone" dataKey="savings" name="Liquid Savings Balance" stroke="#6366f1" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="surplus" name="Monthly Net Surplus" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
