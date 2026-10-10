/**
 * Financial Calculation Engine (Client-Side)
 * Mirrors the backend calculations for instant UI updates.
 */

export function calculateEMI(principal, annualRate, tenureYears) {
  if (annualRate === 0) {
    return tenureYears > 0 ? principal / (tenureYears * 12) : 0;
  }

  const monthlyRate = annualRate / (12 * 100);
  const months = Math.floor(tenureYears * 12);

  if (monthlyRate === 0 || months === 0) return 0;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Math.round(emi * 100) / 100;
}

export function calculateTotalInterest(principal, emi, tenureYears) {
  const months = Math.floor(tenureYears * 12);
  return Math.round((emi * months - principal) * 100) / 100;
}

export function analyzeProfile(profile) {
  const income = profile.monthly_income || 0;

  const fixedExpenses = {
    rent: profile.rent || 0,
    existing_emi: profile.existing_emi || 0,
    utilities: profile.utilities || 0,
    subscriptions: profile.subscriptions || 0,
  };

  const variableExpenses = {
    food: profile.food || 0,
    transport: profile.transport || 0,
    credit_card_payment: profile.credit_card_payment || 0,
    other_expenses: profile.other_expenses || 0,
  };

  const totalFixed = Object.values(fixedExpenses).reduce((a, b) => a + b, 0);
  const totalVariable = Object.values(variableExpenses).reduce((a, b) => a + b, 0);
  const totalExpenses = totalFixed + totalVariable;
  const surplus = income - totalExpenses;
  const savings = profile.savings || 0;

  const totalDebt = (profile.existing_emi || 0) + (profile.credit_card_payment || 0);

  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;
  const dtiRatio = income > 0 ? (totalDebt / income) * 100 : 0;
  const expenseRatio = income > 0 ? (totalExpenses / income) * 100 : 0;
  const emiBurden = income > 0 ? ((profile.existing_emi || 0) / income) * 100 : 0;
  const emergencyMonths = totalExpenses > 0 ? savings / totalExpenses : 0;

  // Health scores
  const incomeStability = Math.min(100, Math.max(0, 100 - Math.abs(expenseRatio - 50)));
  const expenseLoad = Math.max(0, 100 - expenseRatio);
  const debtLoad = Math.max(0, 100 - dtiRatio * 2.5);
  const savingsScore = Math.min(100, savingsRate * 2);
  const emergencyScore = Math.min(100, emergencyMonths * 16.67);

  const overall =
    incomeStability * 0.15 +
    expenseLoad * 0.25 +
    debtLoad * 0.25 +
    savingsScore * 0.2 +
    emergencyScore * 0.15;

  let grade = 'Critical';
  if (overall >= 80) grade = 'Excellent';
  else if (overall >= 65) grade = 'Good';
  else if (overall >= 50) grade = 'Fair';
  else if (overall >= 35) grade = 'Concerning';

  return {
    income: { monthly_income: income, annual_income: income * 12 },
    expenses: {
      fixed: fixedExpenses,
      variable: variableExpenses,
      total_fixed: totalFixed,
      total_variable: totalVariable,
      total_expenses: totalExpenses,
    },
    cash_flow: {
      monthly_surplus: surplus,
      annual_surplus: surplus * 12,
      surplus_percentage: Math.round(savingsRate * 10) / 10,
    },
    debt: {
      total_debt_payments: totalDebt,
      existing_emi: profile.existing_emi || 0,
      credit_card: profile.credit_card_payment || 0,
    },
    ratios: {
      savings_rate: Math.round(savingsRate * 10) / 10,
      debt_to_income: Math.round(dtiRatio * 10) / 10,
      expense_to_income: Math.round(expenseRatio * 10) / 10,
      emi_burden: Math.round(emiBurden * 10) / 10,
    },
    emergency: {
      savings: savings,
      months_covered: Math.round(emergencyMonths * 10) / 10,
    },
    health_scores: {
      income_stability: Math.round(incomeStability * 10) / 10,
      expense_load: Math.round(expenseLoad * 10) / 10,
      debt_load: Math.round(debtLoad * 10) / 10,
      savings_capacity: Math.round(savingsScore * 10) / 10,
      emergency_buffer: Math.round(emergencyScore * 10) / 10,
      overall: Math.round(overall * 10) / 10,
      grade,
    },
  };
}

export function assessRisk(analysis, loan = null) {
  const ratios = analysis.ratios;
  const cashFlow = analysis.cash_flow;
  const emergency = analysis.emergency;
  const income = analysis.income.monthly_income;

  const indicators = [];
  const signals = [];

  // DTI
  const dti = ratios.debt_to_income;
  if (dti > 50) {
    indicators.push({ name: 'Debt Burden', level: 'Critical', value: `${dti}%`, detail: `Debt-to-income ratio (${dti}%) exceeds critical threshold`, icon: 'alert-triangle' });
  } else if (dti > 35) {
    indicators.push({ name: 'Debt Burden', level: 'High', value: `${dti}%`, detail: `Debt-to-income ratio (${dti}%) is elevated`, icon: 'alert-triangle' });
  } else if (dti > 20) {
    indicators.push({ name: 'Debt Burden', level: 'Medium', value: `${dti}%`, detail: `Debt-to-income ratio (${dti}%) is moderate`, icon: 'info' });
  } else {
    indicators.push({ name: 'Debt Burden', level: 'Low', value: `${dti}%`, detail: `Debt-to-income ratio (${dti}%) is healthy`, icon: 'check-circle' });
  }

  // Expense ratio
  const expRatio = ratios.expense_to_income;
  if (expRatio > 75) {
    indicators.push({ name: 'Expense Load', level: 'High', value: `${expRatio}%`, detail: `Expenses consume ${expRatio}% of income`, icon: 'alert-triangle' });
  } else if (expRatio > 60) {
    indicators.push({ name: 'Expense Load', level: 'Medium', value: `${expRatio}%`, detail: `Expenses consume ${expRatio}% of income`, icon: 'info' });
  } else {
    indicators.push({ name: 'Expense Load', level: 'Low', value: `${expRatio}%`, detail: `Expense ratio (${expRatio}%) is well-managed`, icon: 'check-circle' });
  }

  // Savings
  const savingsRate = ratios.savings_rate;
  if (savingsRate < 0) {
    indicators.push({ name: 'Savings Capacity', level: 'Critical', value: `${savingsRate}%`, detail: 'Spending exceeds income', icon: 'alert-triangle' });
  } else if (savingsRate < 10) {
    indicators.push({ name: 'Savings Capacity', level: 'High', value: `${savingsRate}%`, detail: `Savings rate (${savingsRate}%) is below 10%`, icon: 'alert-triangle' });
  } else {
    indicators.push({ name: 'Savings Capacity', level: 'Low', value: `${savingsRate}%`, detail: `Savings rate (${savingsRate}%) is healthy`, icon: 'check-circle' });
  }

  // Emergency
  const emergencyMonths = emergency.months_covered;
  if (emergencyMonths < 3) {
    indicators.push({ name: 'Emergency Buffer', level: emergencyMonths < 1 ? 'High' : 'Medium', value: `${emergencyMonths} months`, detail: `Emergency fund covers ${emergencyMonths} months (recommended: 3+)`, icon: 'alert-triangle' });
  } else {
    indicators.push({ name: 'Emergency Buffer', level: 'Low', value: `${emergencyMonths} months`, detail: `Emergency fund covers ${emergencyMonths} months`, icon: 'check-circle' });
  }

  // Surplus
  const surplus = cashFlow.monthly_surplus;
  if (surplus < 0) {
    indicators.push({ name: 'Monthly Surplus', level: 'Critical', value: `₹${surplus.toLocaleString('en-IN')}`, detail: 'Monthly expenses exceed income', icon: 'alert-triangle' });
  } else if (surplus < 5000) {
    indicators.push({ name: 'Monthly Surplus', level: 'High', value: `₹${surplus.toLocaleString('en-IN')}`, detail: `Surplus of ₹${surplus.toLocaleString('en-IN')} is very tight`, icon: 'alert-triangle' });
  } else {
    indicators.push({ name: 'Monthly Surplus', level: 'Low', value: `₹${surplus.toLocaleString('en-IN')}`, detail: `Surplus of ₹${surplus.toLocaleString('en-IN')} provides buffer`, icon: 'check-circle' });
  }

  // Loan impact
  let newLoanImpact = null;
  if (loan) {
    const newEmi = calculateEMI(loan.loan_amount, loan.interest_rate, loan.tenure_years);
    const totalInterest = calculateTotalInterest(loan.loan_amount, newEmi, loan.tenure_years);
    const totalRepayment = loan.loan_amount + totalInterest;

    const newTotalDebt = analysis.debt.total_debt_payments + newEmi;
    const newDti = income > 0 ? Math.round((newTotalDebt / income) * 1000) / 10 : 0;
    const newEmiBurden = income > 0 ? Math.round(((analysis.debt.existing_emi + newEmi) / income) * 1000) / 10 : 0;
    const newSurplus = surplus - newEmi;
    const newSurplusPct = income > 0 ? Math.round((newSurplus / income) * 1000) / 10 : 0;

    newLoanImpact = {
      new_emi: Math.round(newEmi * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      total_repayment: Math.round(totalRepayment * 100) / 100,
      new_dti: newDti,
      new_emi_burden: newEmiBurden,
      new_monthly_surplus: Math.round(newSurplus * 100) / 100,
      new_surplus_percentage: newSurplusPct,
      surplus_reduction: Math.round((surplus - newSurplus) * 100) / 100,
      surplus_reduction_pct: surplus > 0 ? Math.round(((surplus - newSurplus) / surplus) * 1000) / 10 : 0,
    };

    if (newDti > 50) {
      signals.push({ type: 'warning', message: `New loan pushes DTI to ${newDti}% (critical)`, severity: 'critical' });
    } else if (newDti > 35) {
      signals.push({ type: 'warning', message: `New loan increases DTI to ${newDti}% (elevated)`, severity: 'high' });
    }

    if (newSurplus < 0) {
      signals.push({ type: 'danger', message: 'New loan creates negative cash flow', severity: 'critical' });
    } else if (newSurplus < 5000) {
      signals.push({ type: 'warning', message: `Monthly surplus drops to ₹${newSurplus.toLocaleString('en-IN')}`, severity: 'high' });
    }

    if (newEmiBurden > 40) {
      signals.push({ type: 'warning', message: `Total EMI burden reaches ${newEmiBurden}%`, severity: 'high' });
    }

    if (newSurplus > 5000 && newDti < 35) {
      signals.push({ type: 'positive', message: 'Loan appears manageable within current capacity', severity: 'info' });
    }
  }

  const levelScores = { Low: 0, Medium: 1, High: 2, Critical: 3 };
  const riskValues = indicators.map((i) => levelScores[i.level] || 0);
  const avgRisk = riskValues.reduce((a, b) => a + b, 0) / riskValues.length;
  const compositeScore = Math.round(Math.min(100, (avgRisk / 3) * 100) * 10) / 10;

  let riskLevel = 'Low';
  if (compositeScore >= 70) riskLevel = 'Critical';
  else if (compositeScore >= 50) riskLevel = 'High';
  else if (compositeScore >= 25) riskLevel = 'Medium';

  return {
    composite_score: compositeScore,
    risk_level: riskLevel,
    indicators,
    signals,
    new_loan_impact: newLoanImpact,
  };
}

export function simulateScenario(analysis, loan) {
  const income = analysis.income.monthly_income;
  const currentExpenses = analysis.expenses.total_expenses;
  const currentSurplus = analysis.cash_flow.monthly_surplus;
  const currentDti = analysis.ratios.debt_to_income;
  const currentEmi = analysis.debt.existing_emi;

  const newEmi = calculateEMI(loan.loan_amount, loan.interest_rate, loan.tenure_years);
  const totalInterest = calculateTotalInterest(loan.loan_amount, newEmi, loan.tenure_years);
  const totalRepayment = loan.loan_amount + totalInterest;

  const newTotalEmi = currentEmi + newEmi;
  const newTotalExpenses = currentExpenses + newEmi;
  const newSurplus = income - newTotalExpenses;
  const newDti = income > 0 ? Math.round(((analysis.debt.total_debt_payments + newEmi) / income) * 1000) / 10 : 0;
  const newEmiBurden = income > 0 ? Math.round((newTotalEmi / income) * 1000) / 10 : 0;
  const newExpenseRatio = income > 0 ? Math.round((newTotalExpenses / income) * 1000) / 10 : 0;
  const newSavingsRate = income > 0 ? Math.round((newSurplus / income) * 1000) / 10 : 0;

  let impactSeverity = 'low';
  if (newSurplus < 0) impactSeverity = 'critical';
  else if (newSurplus < 5000) impactSeverity = 'high';
  else if (newDti > 35) impactSeverity = 'medium';

  // Monthly projections
  const months = Math.floor(loan.tenure_years * 12);
  const projections = [];
  let remainingPrincipal = loan.loan_amount;
  const monthlyRate = loan.interest_rate / (12 * 100);
  let cumulativeInterest = 0;

  for (let m = 1; m <= Math.min(months, 60); m++) {
    const interestComponent = remainingPrincipal * monthlyRate;
    const principalComponent = newEmi - interestComponent;
    remainingPrincipal = Math.max(0, remainingPrincipal - principalComponent);
    cumulativeInterest += interestComponent;

    projections.push({
      month: m,
      surplus: Math.round(newSurplus),
      remaining_principal: Math.round(remainingPrincipal),
      cumulative_interest: Math.round(cumulativeInterest),
      total_emi_paid: Math.round(newEmi * m),
    });
  }

  return {
    label: loan.label || 'Loan',
    loan: {
      amount: loan.loan_amount,
      interest_rate: loan.interest_rate,
      tenure_years: loan.tenure_years,
      processing_fee: loan.processing_fee || 0,
    },
    calculations: {
      new_emi: Math.round(newEmi),
      total_interest: Math.round(totalInterest),
      total_repayment: Math.round(totalRepayment),
      effective_cost: Math.round(totalInterest + (loan.processing_fee || 0)),
    },
    before: {
      monthly_emi: currentEmi,
      monthly_expenses: currentExpenses,
      monthly_surplus: currentSurplus,
      debt_to_income: currentDti,
      emi_burden: analysis.ratios.emi_burden,
      expense_ratio: analysis.ratios.expense_to_income,
      savings_rate: analysis.ratios.savings_rate,
    },
    after: {
      monthly_emi: Math.round(newTotalEmi),
      monthly_expenses: Math.round(newTotalExpenses),
      monthly_surplus: Math.round(newSurplus),
      debt_to_income: newDti,
      emi_burden: newEmiBurden,
      expense_ratio: newExpenseRatio,
      savings_rate: newSavingsRate,
    },
    changes: {
      surplus_change: Math.round(newSurplus - currentSurplus),
      dti_change: Math.round((newDti - currentDti) * 10) / 10,
      expense_increase: Math.round(newEmi),
    },
    impact_severity: impactSeverity,
    projections,
  };
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0';
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 10000000) {
    return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    return `${sign}₹${(absAmount / 100000).toFixed(2)} L`;
  } else {
    return `${sign}₹${absAmount.toLocaleString('en-IN')}`;
  }
}

export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('en-IN');
}
