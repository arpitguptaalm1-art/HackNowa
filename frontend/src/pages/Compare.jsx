import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Percent,
  TrendingDown,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { calculateEMI, calculateTotalInterest, analyzeProfile, assessRisk, formatCurrency } from '../utils/calculations';

export default function Compare() {
  const { state, dispatch } = useApp();

  const [loanA, setLoanA] = useState(state.currentLoan || {
    loan_amount: 500000,
    interest_rate: 12,
    tenure_years: 5,
    processing_fee: 5000,
    label: 'Option A (5-Yr Bank Loan)',
  });

  const [loanB, setLoanB] = useState(state.compareLoan || {
    loan_amount: 500000,
    interest_rate: 14,
    tenure_years: 3,
    processing_fee: 2000,
    label: 'Option B (3-Yr NBFC Loan)',
  });

  // Calculations for Option A
  const emiA = useMemo(() => calculateEMI(loanA.loan_amount, loanA.interest_rate, loanA.tenure_years), [loanA]);
  const interestA = useMemo(() => calculateTotalInterest(loanA.loan_amount, emiA, loanA.tenure_years), [loanA, emiA]);
  const totalCostA = loanA.loan_amount + interestA + (loanA.processing_fee || 0);

  // Calculations for Option B
  const emiB = useMemo(() => calculateEMI(loanB.loan_amount, loanB.interest_rate, loanB.tenure_years), [loanB]);
  const interestB = useMemo(() => calculateTotalInterest(loanB.loan_amount, emiB, loanB.tenure_years), [loanB, emiB]);
  const totalCostB = loanB.loan_amount + interestB + (loanB.processing_fee || 0);

  // Risk analyses
  const analysis = useMemo(() => analyzeProfile(state.profile), [state.profile]);
  const riskA = useMemo(() => assessRisk(analysis, loanA), [analysis, loanA]);
  const riskB = useMemo(() => assessRisk(analysis, loanB), [analysis, loanB]);

  // Differences
  const emiDiff = emiB - emiA;
  const interestDiff = interestB - interestA;
  const totalCostDiff = totalCostB - totalCostA;

  const comparisonChartData = [
    {
      name: 'Monthly EMI',
      'Option A': emiA,
      'Option B': emiB,
    },
    {
      name: 'Total Interest (Thousands)',
      'Option A': Math.round(interestA / 1000),
      'Option B': Math.round(interestB / 1000),
    },
    {
      name: 'Total Repayment (Thousands)',
      'Option A': Math.round(totalCostA / 1000),
      'Option B': Math.round(totalCostB / 1000),
    },
  ];

  return (
    <div className="main-content">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="section-title">Compare Loan Offers</h1>
          <p className="section-subtitle">
            Evaluate 2 loan offers side-by-side to understand monthly EMI strain vs total long-term interest cost.
          </p>
        </div>
      </div>

      {/* Inputs Grid: Loan A vs Loan B */}
      <div className="grid grid-2" style={{ gap: '24px', marginBottom: '28px' }}>
        {/* Loan Option A */}
        <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
          <div className="card-header">
            <h3 className="card-title">Option A: {loanA.label || 'Standard Offer'}</h3>
            <span className="badge badge-accent">Loan A</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Loan Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                value={loanA.loan_amount}
                onChange={(e) => setLoanA({ ...loanA, loan_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-2" style={{ gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Interest Rate (% p.a)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={loanA.interest_rate}
                  onChange={(e) => setLoanA({ ...loanA, interest_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tenure (Years)</label>
                <input
                  type="number"
                  className="form-control"
                  value={loanA.tenure_years}
                  onChange={(e) => setLoanA({ ...loanA, tenure_years: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Processing Fee (₹)</label>
              <input
                type="number"
                className="form-control"
                value={loanA.processing_fee}
                onChange={(e) => setLoanA({ ...loanA, processing_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Calculated summary for A */}
            <div className="stat-card accent" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="stat-label">Monthly EMI</div>
              <div className="stat-value" style={{ color: 'var(--accent-light)' }}>
                {formatCurrency(emiA)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                <span>Total Interest: <strong>{formatCurrency(interestA)}</strong></span>
                <span>Risk Score: <strong>{Math.round(riskA.risk_score)}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Option B */}
        <div className="card" style={{ borderTop: '4px solid var(--info)' }}>
          <div className="card-header">
            <h3 className="card-title">Option B: {loanB.label || 'Alternative Offer'}</h3>
            <span className="badge badge-info">Loan B</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Loan Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                value={loanB.loan_amount}
                onChange={(e) => setLoanB({ ...loanB, loan_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-2" style={{ gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Interest Rate (% p.a)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={loanB.interest_rate}
                  onChange={(e) => setLoanB({ ...loanB, interest_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tenure (Years)</label>
                <input
                  type="number"
                  className="form-control"
                  value={loanB.tenure_years}
                  onChange={(e) => setLoanB({ ...loanB, tenure_years: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Processing Fee (₹)</label>
              <input
                type="number"
                className="form-control"
                value={loanB.processing_fee}
                onChange={(e) => setLoanB({ ...loanB, processing_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Calculated summary for B */}
            <div className="stat-card info" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="stat-label">Monthly EMI</div>
              <div className="stat-value" style={{ color: 'var(--info-light)' }}>
                {formatCurrency(emiB)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                <span>Total Interest: <strong>{formatCurrency(interestB)}</strong></span>
                <span>Risk Score: <strong>{Math.round(riskB.risk_score)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary Banner */}
      <div className="card" style={{ marginBottom: '28px', background: 'var(--gradient-card)', border: '1px solid var(--border-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Sparkles className="text-accent" size={24} />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>ArthIQ Trade-Off Matrix</h3>
        </div>

        <div className="grid grid-3" style={{ gap: '16px' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Monthly Cashflow Difference</div>
            <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
              {emiDiff > 0 ? `Option A is ${formatCurrency(emiDiff)}/mo cheaper` : `Option B is ${formatCurrency(Math.abs(emiDiff))}/mo cheaper`}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {emiDiff > 0
                ? 'Option A leaves you with more monthly breathing room.'
                : 'Option B leaves you with more monthly breathing room.'}
            </p>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Total Interest Savings</div>
            <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
              {interestDiff > 0 ? `Option A saves ${formatCurrency(interestDiff)}` : `Option B saves ${formatCurrency(Math.abs(interestDiff))}`}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {interestDiff > 0
                ? 'Option A charges less interest overall over its tenure.'
                : 'Option B charges less interest overall over its tenure.'}
            </p>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Risk & Safety Rating</div>
            <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>
              {riskA.risk_score < riskB.risk_score ? 'Option A is Safer' : 'Option B is Safer'}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Based on lower monthly DTI ratio and impact on emergency buffer.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Bar Comparison Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Side-by-Side Financial Comparison</h3>
          <span className="badge badge-neutral">Comparative Chart</span>
        </div>
        <div style={{ height: '320px', width: '100%', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData}>
              <XAxis dataKey="name" stroke="#6b6b7b" />
              <YAxis stroke="#6b6b7b" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(22, 22, 32, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="Option A" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Option B" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
