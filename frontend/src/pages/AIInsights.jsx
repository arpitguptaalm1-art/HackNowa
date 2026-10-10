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
  Bot,
  Send,
  Lock,
  ThumbsUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeProfile, assessRisk, calculateEMI, formatCurrency } from '../utils/calculations';
import { getExplanation } from '../utils/api';

/**
 * Clean markdown helper to strip raw asterisks and turn markdown into clean HTML
 */
function cleanMarkdownToHTML(text) {
  if (!text) return '';

  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size:15px; font-weight:700; margin: 12px 0 6px 0; color:var(--text-primary);">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size:17px; font-weight:800; margin: 16px 0 8px 0; color:var(--accent-light);">$1</h2>')
    .replace(/^\* (.*$)/gim, '<li style="margin-left:16px; margin-bottom:4px;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-left:16px; margin-bottom:4px;">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  // Strip remaining solitary * symbols
  html = html.replace(/\s\*\s/g, ' ');

  return html;
}

export default function AIInsights() {
  const { state } = useApp();
  const [loading, setLoading] = useState(false);
  const [explanationText, setExplanationText] = useState(null);
  const [userQuery, setUserQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your ArthIQ Risk Assistant. Ask me anything about this loan evaluation, debt-to-income ratio, or emergency buffer calculation.',
    },
  ]);

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
        setExplanationText(cleanMarkdownToHTML(res.data.explanation));
      }
    } catch (err) {
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

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const q = userQuery.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setUserQuery('');

    // Simulate smart context-aware response
    setTimeout(() => {
      let reply = '';
      const lower = q.toLowerCase();
      if (lower.includes('salary') || lower.includes('income') || lower.includes('cut')) {
        reply = `Based on your monthly salary of ${formatCurrency(profile.monthly_income)}, taking this EMI of ${formatCurrency(emi)} consumes ${newDti}% of your income. A 20% drop in salary would reduce your net surplus to ${formatCurrency(Math.max(0, newSurplus - profile.monthly_income * 0.2))}.`;
      } else if (lower.includes('emi') || lower.includes('loan') || lower.includes('reduce')) {
        reply = `To keep your DTI ratio safely below 40%, consider reducing the loan principal to ${formatCurrency(loan.loan_amount * 0.75)} or extending the tenure to ${loan.tenure_years + 2} years.`;
      } else {
        reply = `Your current liquid reserves cover ${bufferMonths} months of expenses. Financial planners recommend keeping at least 6 months of buffer before locking into a ${loan.tenure_years}-year EMI commitment.`;
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="section-title">ArthIQ AI Risk Intelligence</h1>
          <p className="section-subtitle">
            Plain-English AI diagnosis, risk trade-offs, and intelligent decision breakdown.
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

        {/* Clean Formatted AI Summary (No stray asterisks) */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            lineHeight: '1.7',
            fontSize: '14px',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          {explanationText ? (
            <div dangerouslySetInnerHTML={{ __html: explanationText }} />
          ) : (
            <div>
              <p style={{ marginBottom: '14px' }}>
                <strong>Executive Summary:</strong> Taking this proposed loan of {formatCurrency(loan.loan_amount)} will commit{' '}
                <strong style={{ color: 'var(--accent-light)' }}>{newDti}% of your monthly take-home income</strong> strictly to debt service (existing EMIs + credit cards + new loan).
              </p>
              <p style={{ marginBottom: '14px' }}>
                {newSurplus > 10000 ? (
                  <span style={{ color: 'var(--success-light)', fontWeight: 600 }}>
                    ✓ Healthy Buffer: Your remaining monthly net surplus of {formatCurrency(newSurplus)} provides a solid cushion for unexpected expenses.
                  </span>
                ) : newSurplus >= 0 ? (
                  <span style={{ color: 'var(--warning-light)', fontWeight: 600 }}>
                    ⚠ Tight Margin: Your remaining monthly net surplus shrinks to {formatCurrency(newSurplus)}. Unplanned bills could force you into debt.
                  </span>
                ) : (
                  <span style={{ color: 'var(--danger-light)', fontWeight: 600 }}>
                    🚨 Cash Deficit Warning: Your net monthly cashflow turns negative (-{formatCurrency(Math.abs(newSurplus))}). You will operate at a loss every month.
                  </span>
                )}
              </p>
              <p>
                <strong>Emergency Runway:</strong> Liquid savings of {formatCurrency(profile.savings)} provide{' '}
                <strong>{bufferMonths} months</strong> of emergency runway under this proposed debt structure.
              </p>
            </div>
          )}
        </div>

        {/* 3 Key Trade-offs Grid */}
        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Key Risk Drivers & Trade-Offs</h4>
        <div className="grid grid-3" style={{ gap: '16px' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              1. Debt-to-Income Strain
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Total debt obligations increase from {analysis.ratios.debt_to_income}% to {newDti}%. Financial guidelines recommend keeping DTI under 40%.
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              2. Income Sensitivity
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              A 15% reduction in salary or income would drop your net monthly savings margin from {analysis.cash_flow.surplus_percentage}% down to zero.
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              3. Emergency Cushion
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Current liquid reserves equal {bufferMonths} months of living costs. Recommended minimum buffer before taking high-tenure debt is 6 months.
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} className="text-success" /> ArthIQ Mitigation Recommendations
          </h3>
          <span className="badge badge-success">Smart Decision Paths</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)' }}>01</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                Option 1: Reduce Loan Amount by 20%
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Borrowing {formatCurrency(loan.loan_amount * 0.8)} instead of {formatCurrency(loan.loan_amount)} lowers monthly EMI to{' '}
                {formatCurrency(calculateEMI(loan.loan_amount * 0.8, loan.interest_rate, loan.tenure_years))}/mo, saving{' '}
                {formatCurrency((emi - calculateEMI(loan.loan_amount * 0.8, loan.interest_rate, loan.tenure_years)) * 12 * loan.tenure_years)} total interest.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--info)' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--info)' }}>02</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                Option 2: Extend Tenure to {loan.tenure_years + 2} Years
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Increasing tenure by 2 years lowers your monthly commitment to{' '}
                {formatCurrency(calculateEMI(loan.loan_amount, loan.interest_rate, loan.tenure_years + 2))}/mo, protecting monthly cash flow flexibility.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--warning)' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--warning)' }}>03</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                Option 3: Save 2 Months Buffer First
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Accumulating an extra {formatCurrency(emi * 2)} in savings before taking this loan ensures your emergency runway remains above 6.0 months.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive AI Chat Assistant */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} className="text-accent" /> Interactive ArthIQ Financial Assistant
          </h3>
          <span className="badge badge-accent">Context-Aware AI</span>
        </div>

        <div
          style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            maxHeight: '320px',
            overflowY: 'auto',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: msg.sender === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                lineHeight: '1.5',
                border: msg.sender === 'ai' ? '1px solid var(--border-primary)' : 'none',
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Ask AI e.g. What happens if my salary drops by 20% or I take a lower EMI?"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
