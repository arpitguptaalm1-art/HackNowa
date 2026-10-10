/**
 * ArthIQ API Client
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = 'http://localhost:8000';

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

export async function analyzeFinancials(profile) {
  return apiCall('/api/financial/analyze', 'POST', profile);
}

export async function assessRisk(profile, loan = null) {
  const body = { ...profile };
  if (loan) {
    return apiCall('/api/risk/assess', 'POST', { ...profile, loan });
  }
  return apiCall('/api/risk/assess', 'POST', profile);
}

export async function simulateScenario(profile, loans) {
  return apiCall('/api/scenario/simulate', 'POST', { profile, loans });
}

export async function compareLoans(profile, loanA, loanB) {
  return apiCall('/api/scenario/compare', 'POST', {
    profile,
    loan_a: loanA,
    loan_b: loanB,
  });
}

export async function getExplanation(profile, loan = null) {
  return apiCall('/api/explain', 'POST', { profile, loan });
}

export async function fullAnalysis(profile, loans) {
  return apiCall('/api/full-analysis', 'POST', { profile, loans });
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/document/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Document parsing failed');
  }

  return response.json();
}
