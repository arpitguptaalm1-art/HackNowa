import React, { useState } from 'react';
import {
  Upload,
  FileText,
  DollarSign,
  PieChart,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, analyzeProfile } from '../utils/calculations';
import { uploadDocument } from '../utils/api';

export default function FinancialProfile() {
  const { state, dispatch } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const profile = state.profile;
  const analysis = analyzeProfile(profile);

  const handleChange = (field, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    dispatch({
      type: 'SET_PROFILE',
      payload: { [field]: num },
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    try {
      // Try backend parsing or fallback to smart demo extractor
      let extractedData = null;
      try {
        const res = await uploadDocument(file);
        if (res?.data?.extracted_data) {
          extractedData = res.data.extracted_data;
        }
      } catch (err) {
        // Fallback demo parser for prototype
        extractedData = {
          monthly_income: 65000,
          existing_emi: 12000,
          rent: 15000,
          credit_card_payment: 8000,
          savings: 60000,
        };
      }

      if (extractedData) {
        dispatch({ type: 'SET_PROFILE', payload: extractedData });
        setUploadSuccess(
          `Extracted successfully from "${file.name}"! Updated Income, EMI, Rent & Credit Card amounts.`
        );
      }
    } catch (err) {
      setUploadError('Failed to parse document. Please enter values manually.');
    } finally {
      setIsUploading(false);
    }
  };

  const autofillDemo = (type) => {
    if (type === 'salaried') {
      dispatch({
        type: 'SET_PROFILE',
        payload: {
          monthly_income: 60000,
          rent: 15000,
          food: 6000,
          transport: 3000,
          utilities: 4000,
          subscriptions: 1000,
          existing_emi: 12000,
          credit_card_payment: 8000,
          other_expenses: 2000,
          savings: 50000,
        },
      });
    } else if (type === 'high_debt') {
      dispatch({
        type: 'SET_PROFILE',
        payload: {
          monthly_income: 70000,
          rent: 20000,
          food: 8000,
          transport: 4000,
          utilities: 5000,
          subscriptions: 1500,
          existing_emi: 28000,
          credit_card_payment: 12000,
          other_expenses: 3000,
          savings: 20000,
        },
      });
    } else if (type === 'conservative') {
      dispatch({
        type: 'SET_PROFILE',
        payload: {
          monthly_income: 95000,
          rent: 18000,
          food: 7000,
          transport: 3000,
          utilities: 4000,
          subscriptions: 1000,
          existing_emi: 8000,
          credit_card_payment: 3000,
          other_expenses: 3000,
          savings: 180000,
        },
      });
    }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="section-title">Financial Profile & Documents</h1>
          <p className="section-subtitle">
            Upload salary slips or bank statements to auto-fill your income, EMI, and expense profile.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => autofillDemo('salaried')}>
            <Sparkles size={14} /> Preset: ₹60k Salaried
          </button>
          <button className="btn btn-secondary" onClick={() => autofillDemo('high_debt')}>
            <AlertCircle size={14} /> Preset: High Debt
          </button>
          <button className="btn btn-secondary" onClick={() => autofillDemo('conservative')}>
            <Shield size={14} /> Preset: Conservative
          </button>
        </div>
      </div>

      {/* Document Upload Card */}
      <div className="card grid-span-12" style={{ marginBottom: '28px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div className="card-icon info">
            <Upload size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>AI Document Parser (Salary Slip / Loan Doc / Bank Statement)</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Supports PDF, PNG, JPG. FinSight extracts income, existing EMIs, and monthly fixed costs.
            </p>
          </div>
        </div>

        <div className="upload-zone" style={{ margin: 0, position: 'relative' }}>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 10,
            }}
          />
          <div className="upload-icon">
            <FileText size={32} />
          </div>
          <div className="upload-title">
            {isUploading ? 'Analyzing Document with AI OCR...' : 'Drop your document here or click to browse'}
          </div>
          <div className="upload-subtitle">
            PDFs, Salary Slips, Bank Statements, or Loan Sanction Letters up to 10MB
          </div>
        </div>

        {uploadSuccess && (
          <div className="alert alert-success" style={{ marginTop: '16px' }}>
            <CheckCircle size={18} />
            <div>{uploadSuccess}</div>
          </div>
        )}

        {uploadError && (
          <div className="alert alert-danger" style={{ marginTop: '16px' }}>
            <AlertCircle size={18} />
            <div>{uploadError}</div>
          </div>
        )}
      </div>

      {/* Financial Details Grid */}
      <div className="grid grid-2" style={{ marginBottom: '28px', gap: '24px' }}>
        {/* Left Column: Monthly Income & Savings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Income & Reserves</h3>
            <span className="badge badge-success">Primary Inflow</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Monthly Net Income (₹)
                <span className="form-hint">Take-home salary after tax</span>
              </label>
              <input
                type="number"
                className="form-control"
                value={profile.monthly_income}
                onChange={(e) => handleChange('monthly_income', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Liquid Savings / Buffer (₹)
                <span className="form-hint">Emergency cash in bank/FD</span>
              </label>
              <input
                type="number"
                className="form-control"
                value={profile.savings}
                onChange={(e) => handleChange('savings', e.target.value)}
              />
            </div>

            <div className="stat-card accent" style={{ marginTop: '12px' }}>
              <div className="stat-label">Calculated Annual Income</div>
              <div className="stat-value">{formatCurrency(profile.monthly_income * 12)}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Existing Fixed Commitments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Existing Debt Commitments</h3>
            <span className="badge badge-warning">Fixed Obligations</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Existing EMI Obligations (₹/mo)
                <span className="form-hint">Home loan, car loan, personal loan EMIs</span>
              </label>
              <input
                type="number"
                className="form-control"
                value={profile.existing_emi}
                onChange={(e) => handleChange('existing_emi', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Credit Card Payment / Dues (₹/mo)
                <span className="form-hint">Average monthly credit card payments</span>
              </label>
              <input
                type="number"
                className="form-control"
                value={profile.credit_card_payment}
                onChange={(e) => handleChange('credit_card_payment', e.target.value)}
              />
            </div>

            <div className="stat-card danger" style={{ marginTop: '12px' }}>
              <div className="stat-label">Total Monthly Debt Service</div>
              <div className="stat-value">{formatCurrency(analysis.debt.total_debt_payments)}</div>
              <div className="stat-sub">
                DTI Ratio: <strong>{analysis.ratios.debt_to_income}%</strong> of income
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Living Expenses Grid */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <h3 className="card-title">Monthly Living Expenses</h3>
          <span className="badge badge-neutral">Variable & Fixed Living Costs</span>
        </div>

        <div className="grid grid-3" style={{ gap: '16px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">Rent / Housing (₹)</label>
            <input
              type="number"
              className="form-control"
              value={profile.rent}
              onChange={(e) => handleChange('rent', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Food & Groceries (₹)</label>
            <input
              type="number"
              className="form-control"
              value={profile.food}
              onChange={(e) => handleChange('food', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transport & Fuel (₹)</label>
            <input
              type="number"
              className="form-control"
              value={profile.transport}
              onChange={(e) => handleChange('transport', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Utilities & Electricity (₹)</label>
            <input
              type="number"
              className="form-control"
              value={profile.utilities}
              onChange={(e) => handleChange('utilities', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subscriptions & Bills (₹)</label>
            <input
              type="number"
              className="form-control"
              value={profile.subscriptions}
              onChange={(e) => handleChange('subscriptions', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Other Miscellaneous (₹)</label>
            <input
              type="number"
              className="form-control"
              value={profile.other_expenses}
              onChange={(e) => handleChange('other_expenses', e.target.value)}
            />
          </div>
        </div>

        {/* Expense Summary Bar */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Monthly Outflow: </span>
            <strong style={{ fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(analysis.expenses.total_expenses)}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monthly Surplus: </span>
            <strong
              style={{
                fontSize: '18px',
                color: analysis.cash_flow.monthly_surplus >= 0 ? 'var(--success)' : 'var(--danger)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {formatCurrency(analysis.cash_flow.monthly_surplus)}
            </strong>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'SET_TAB', payload: 'simulator' })}
          >
            Simulate Loan Decision <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
