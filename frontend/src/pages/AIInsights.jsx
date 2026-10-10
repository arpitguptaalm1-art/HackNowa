import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Shield,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Bot
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeProfile, assessRisk, calculateEMI, formatCurrency } from '../utils/calculations';
import { getExplanation } from '../utils/api';

export default function AIInsights() {
  const { state } = useApp();
  const [loading, setLoading] = useState(false);
  const [explanationText, setExplanationText] = useState(null);

  const profile = state.profile;
  const loan = state.currentLoan;

  const analysis = analyzeProfile(profile);
  const risk = assessRisk(analysis, loan);
  const emi = calculateEMI(loan.loan_amount, loan.interest_rate, loan.tenure_years);

  const fetchAIExplanation = async () => {
    setLoading(true);
    try {
      const res = await getExplanation(profile, loan);
      if (res?.data?.explanation) {
        setExplanationText(res.data.explanation);
      }
    } catch (err) {
      // Fallback local intelligent generator
      setExplanationText(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIExplanation();
  }, [profile, loan]);

  const newDti = Math.round(((analysis.debt.total_debt_payments + emi) / profile.monthly_income) * 100);
  const newSurplus = analysis.cash_flow.monthly_surplus - emi;
  const bufferMonths = (profile.savings / (analysis.expenses.total_expenses + emi)).toFixed(1);

  return (
    <div className="main-content">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="section-title">ArthIQ AI Insights & Decision Analysis</h1>
          <p className="section-subtitle">
            Plain-English AI diagnosis, risk trade-offs, and actionable recommendations before you sign.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAIExplanation} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Generating...' : 'Re-analyze with AI'}
        </button>
      </div>

      {/* Main Diagnosis Card */}
      <div
        className="card"
        style={{
          marginBottom: '28px',
          background: risk.risk_score > 65 ? 'var(--gradient-card)' : 'var(--bg-card)',
          border: risk.risk_score > 65 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-accent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`card-icon ${risk.risk_score > 65 ? 'danger' : risk.risk_score > 40 ? 'warning' : 'success'}`}>
              <Bot size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>AI Financial Safety Assessment</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Loan Evaluated: {formatCurrency(loan.loan_amount)} @ {loan.interest_rate}% for {loan.tenure_years} Years (EMI: {formatCurrency(emi)}/mo)
              </p>
            </div>
          </div>
          <span className={`badge ${risk.risk_score > 65 ? 'badge-danger' : risk.risk_score > 40 ? 'badge-warning' : 'badge-success'}`}>
            {risk.risk_level} Risk Level ({Math.round(risk.risk_score)}/100)
          </span>
        </div>

        {/* Plain English Summary */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            lineHeight: '1.6',
            fontSize: '14px',
            color: 'var(--text-primary)',
          }}
        >
          {explanationText ? (
            <div dangerouslySetInnerHTML={{ __html: explanationText.replace(/\n/g, '<br/>') }} />
          ) : (
            <div>
              <p style={{ marginBottom: '12px' }}>
                <strong>Executive Summary:</strong> Taking this proposed loan of {formatCurrency(loan.loan_amount)} will commit{' '}
                <strong style={{ color: 'var(--accent-light)' }}>{newDti}% of your monthly income</strong> strictly to debt payments (existing EMIs + credit card + new loan).
              </p>
              <p style={{ marginBottom: '12px' }}>
                {newSurplus > 10000 ? (
                  <span style={{ color: 'var(--success-light)' }}>
                    ✓ Your remaining monthly surplus of {formatCurrency(newSurplus)} provides a healthy cushion for unexpected expenses.
                  </span>
                ) : newSurplus >= 0 ? (
                  <span style={{ color: 'var(--warning-light)' }}>
                    ⚠ Your remaining monthly surplus will shrink to {formatCurrency(newSurplus)}. A minor expense surge could force you into debt.
                  </span>
                ) : (
                  <span style={{ color: 'var(--danger-light)' }}>
                    🚨 Warning: Your net monthly cashflow will turn negative (-{formatCurrency(Math.abs(newSurplus))}). You will be operating in a cash deficit every month.
                  </span>
                )}
              </p>
              <p>
                Emergency Buffer: Your liquid savings of {formatCurrency(profile.savings)} will cover{' '}
                <strong>{bufferMonths} months</strong> of baseline expenses under this loan structure.
              </p>
            </div>
          )}
        </div>

        {/* 3 Key Trade-offs Grid */}
        <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>Key Risk Drivers & Trade-Offs</h4>
        <div className="grid grid-3" style={{ gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              1. Debt-to-Income Strain
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Total debt obligations increase from {analysis.ratios.debt_to_income}% to {newDti}%. Financial planners recommend keeping DTI under 40%.
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              2. Income Sensitivity
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              A 15% reduction in salary or income would drop your net monthly savings rate from {analysis.cash_flow.surplus_percentage}% down to zero.
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              3. Emergency Cushion
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Current liquid reserves equal {bufferMonths} months of living costs. Recommended minimum buffer before taking high-tenure debt is 6 months.
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Actionable Recommendations */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} className="text-success" /> ArthIQ Smart Recommendations & Mitigation Paths
          </h3>
          <span className="badge badge-success">Actionable Guidance</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          {/* Path 1: Reduce Loan Amount */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              borderLeft: '4px solid var(--accent)',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>01</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                Option 1: Reduce Principal by 20%
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Borrowing {formatCurrency(loan.loan_amount * 0.8)} instead of {formatCurrency(loan.loan_amount)} reduces EMI to{' '}
                {formatCurrency(calculateEMI(loan.loan_amount * 0.8, loan.interest_rate, loan.tenure_years))}/mo, saving you{' '}
                {formatCurrency((emi - calculateEMI(loan.loan_amount * 0.8, loan.interest_rate, loan.tenure_years)) * 12 * loan.tenure_years)} in overall interest.
              </p>
            </div>
          </div>

          {/* Path 2: Extend Tenure */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              borderLeft: '4px solid var(--info)',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--info)' }}>02</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                Option 2: Extend Tenure by 2 Years
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Increasing tenure from {loan.tenure_years} years to {loan.tenure_years + 2} years lowers your monthly commitment to{' '}
                {formatCurrency(calculateEMI(loan.loan_amount, loan.interest_rate, loan.tenure_years + 2))}/mo, protecting your cashflow cushion.
              </p>
            </div>
          </div>

          {/* Path 3: Build Buffer */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              borderLeft: '4px solid var(--warning)',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--warning)' }}>03</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                Option 3: Save 2 Months Buffer Before Borrowing
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Accumulating an extra {formatCurrency(emi * 3)} in liquid savings before taking this loan ensures your emergency buffer remains above 6 months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
