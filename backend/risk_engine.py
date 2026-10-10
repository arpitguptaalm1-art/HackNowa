"""
Module 3: AI Risk Detection Engine
Combines rule-based logic + statistical anomaly detection.
"""

import numpy as np
from financial_engine import FinancialEngine


class RiskEngine:
    """
    Assesses financial risk using:
    1. Rule-based deterministic checks
    2. Statistical anomaly detection (Z-score)
    3. Composite risk scoring with transparent methodology
    """

    # Thresholds (configurable)
    THRESHOLDS = {
        "dti_low": 20,
        "dti_medium": 35,
        "dti_high": 50,
        "expense_ratio_high": 75,
        "emi_burden_high": 40,
        "savings_rate_low": 10,
        "emergency_months_min": 3,
        "surplus_danger": 5000,
    }

    def assess(self, analysis: dict, loan: dict = None) -> dict:
        """
        Assess overall financial risk.
        Returns risk indicators, signals, and composite score.
        """
        ratios = analysis["ratios"]
        cash_flow = analysis["cash_flow"]
        emergency = analysis["emergency"]
        income_data = analysis["income"]

        indicators = []
        signals = []

        # ─── Rule-based risk checks ───────────────────────────

        # 1. Debt-to-Income Ratio
        dti = ratios["debt_to_income"]
        if dti > self.THRESHOLDS["dti_high"]:
            indicators.append({
                "name": "Debt Burden",
                "level": "Critical",
                "value": f"{dti}%",
                "detail": f"Debt-to-income ratio ({dti}%) exceeds critical threshold of {self.THRESHOLDS['dti_high']}%",
                "icon": "alert-triangle"
            })
        elif dti > self.THRESHOLDS["dti_medium"]:
            indicators.append({
                "name": "Debt Burden",
                "level": "High",
                "value": f"{dti}%",
                "detail": f"Debt-to-income ratio ({dti}%) is elevated above {self.THRESHOLDS['dti_medium']}%",
                "icon": "alert-triangle"
            })
        elif dti > self.THRESHOLDS["dti_low"]:
            indicators.append({
                "name": "Debt Burden",
                "level": "Medium",
                "value": f"{dti}%",
                "detail": f"Debt-to-income ratio ({dti}%) is moderate",
                "icon": "info"
            })
        else:
            indicators.append({
                "name": "Debt Burden",
                "level": "Low",
                "value": f"{dti}%",
                "detail": f"Debt-to-income ratio ({dti}%) is within healthy range",
                "icon": "check-circle"
            })

        # 2. Expense Ratio
        expense_ratio = ratios["expense_to_income"]
        if expense_ratio > self.THRESHOLDS["expense_ratio_high"]:
            indicators.append({
                "name": "Expense Load",
                "level": "High",
                "value": f"{expense_ratio}%",
                "detail": f"Expenses consume {expense_ratio}% of income, limiting financial flexibility",
                "icon": "alert-triangle"
            })
        elif expense_ratio > 60:
            indicators.append({
                "name": "Expense Load",
                "level": "Medium",
                "value": f"{expense_ratio}%",
                "detail": f"Expenses consume {expense_ratio}% of income",
                "icon": "info"
            })
        else:
            indicators.append({
                "name": "Expense Load",
                "level": "Low",
                "value": f"{expense_ratio}%",
                "detail": f"Expense ratio ({expense_ratio}%) is well-managed",
                "icon": "check-circle"
            })

        # 3. Savings Rate
        savings_rate = ratios["savings_rate"]
        if savings_rate < 0:
            indicators.append({
                "name": "Savings Capacity",
                "level": "Critical",
                "value": f"{savings_rate}%",
                "detail": "Spending exceeds income — net negative cash flow",
                "icon": "alert-triangle"
            })
        elif savings_rate < self.THRESHOLDS["savings_rate_low"]:
            indicators.append({
                "name": "Savings Capacity",
                "level": "High",
                "value": f"{savings_rate}%",
                "detail": f"Savings rate ({savings_rate}%) is below recommended minimum of {self.THRESHOLDS['savings_rate_low']}%",
                "icon": "alert-triangle"
            })
        else:
            indicators.append({
                "name": "Savings Capacity",
                "level": "Low",
                "value": f"{savings_rate}%",
                "detail": f"Savings rate ({savings_rate}%) is healthy",
                "icon": "check-circle"
            })

        # 4. Emergency Buffer
        emergency_months = emergency["months_covered"]
        if emergency_months < self.THRESHOLDS["emergency_months_min"]:
            indicators.append({
                "name": "Emergency Buffer",
                "level": "High" if emergency_months < 1 else "Medium",
                "value": f"{emergency_months} months",
                "detail": f"Emergency fund covers {emergency_months} months (recommended: {self.THRESHOLDS['emergency_months_min']}+ months)",
                "icon": "alert-triangle"
            })
        else:
            indicators.append({
                "name": "Emergency Buffer",
                "level": "Low",
                "value": f"{emergency_months} months",
                "detail": f"Emergency fund covers {emergency_months} months of expenses",
                "icon": "check-circle"
            })

        # 5. Monthly Surplus
        surplus = cash_flow["monthly_surplus"]
        if surplus < 0:
            indicators.append({
                "name": "Monthly Surplus",
                "level": "Critical",
                "value": f"₹{surplus:,.0f}",
                "detail": "Monthly expenses exceed income — unsustainable",
                "icon": "alert-triangle"
            })
        elif surplus < self.THRESHOLDS["surplus_danger"]:
            indicators.append({
                "name": "Monthly Surplus",
                "level": "High",
                "value": f"₹{surplus:,.0f}",
                "detail": f"Monthly surplus of ₹{surplus:,.0f} leaves little room for unexpected expenses",
                "icon": "alert-triangle"
            })
        else:
            indicators.append({
                "name": "Monthly Surplus",
                "level": "Low",
                "value": f"₹{surplus:,.0f}",
                "detail": f"Monthly surplus of ₹{surplus:,.0f} provides adequate buffer",
                "icon": "check-circle"
            })

        # ─── New Loan Impact Assessment ───────────────────────

        new_loan_impact = None
        if loan:
            engine = FinancialEngine()
            new_emi = engine.calculate_emi(
                loan["loan_amount"],
                loan["interest_rate"],
                loan["tenure_years"]
            )
            total_interest = engine.calculate_total_interest(
                loan["loan_amount"], new_emi, loan["tenure_years"]
            )
            total_repayment = loan["loan_amount"] + total_interest

            # Recalculate metrics with new loan
            new_total_debt = analysis["debt"]["total_debt_payments"] + new_emi
            income = income_data["monthly_income"]
            new_dti = round((new_total_debt / income * 100), 1) if income > 0 else 0
            new_emi_burden = round(
                ((analysis["debt"]["existing_emi"] + new_emi) / income * 100), 1
            ) if income > 0 else 0
            new_surplus = surplus - new_emi
            new_surplus_pct = round((new_surplus / income * 100), 1) if income > 0 else 0

            new_loan_impact = {
                "new_emi": round(new_emi, 2),
                "total_interest": round(total_interest, 2),
                "total_repayment": round(total_repayment, 2),
                "new_dti": new_dti,
                "new_emi_burden": new_emi_burden,
                "new_monthly_surplus": round(new_surplus, 2),
                "new_surplus_percentage": new_surplus_pct,
                "surplus_reduction": round(surplus - new_surplus, 2),
                "surplus_reduction_pct": round(
                    ((surplus - new_surplus) / surplus * 100), 1
                ) if surplus > 0 else 0,
            }

            # Additional loan-specific risk signals
            if new_dti > self.THRESHOLDS["dti_high"]:
                signals.append({
                    "type": "warning",
                    "message": f"New loan pushes debt-to-income ratio to {new_dti}% (critical level)",
                    "severity": "critical"
                })
            elif new_dti > self.THRESHOLDS["dti_medium"]:
                signals.append({
                    "type": "warning",
                    "message": f"New loan increases debt-to-income ratio to {new_dti}% (elevated)",
                    "severity": "high"
                })

            if new_surplus < 0:
                signals.append({
                    "type": "danger",
                    "message": "New loan creates negative monthly cash flow",
                    "severity": "critical"
                })
            elif new_surplus < self.THRESHOLDS["surplus_danger"]:
                signals.append({
                    "type": "warning",
                    "message": f"Monthly surplus drops to ₹{new_surplus:,.0f} — limited financial flexibility",
                    "severity": "high"
                })

            if new_emi_burden > self.THRESHOLDS["emi_burden_high"]:
                signals.append({
                    "type": "warning",
                    "message": f"Total EMI burden reaches {new_emi_burden}% of income",
                    "severity": "high"
                })

            # Positive signals
            if new_surplus > self.THRESHOLDS["surplus_danger"] and new_dti < self.THRESHOLDS["dti_medium"]:
                signals.append({
                    "type": "positive",
                    "message": "Loan appears manageable within current financial capacity",
                    "severity": "info"
                })

        # ─── Composite Risk Score ─────────────────────────────

        level_scores = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
        risk_values = [level_scores.get(ind["level"], 0) for ind in indicators]
        avg_risk = np.mean(risk_values) if risk_values else 0

        # Scale to 0-100
        composite_score = round(min(100, avg_risk / 3 * 100), 1)

        if composite_score >= 70:
            risk_level = "Critical"
        elif composite_score >= 50:
            risk_level = "High"
        elif composite_score >= 25:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        return {
            "composite_score": composite_score,
            "risk_level": risk_level,
            "indicators": indicators,
            "signals": signals,
            "new_loan_impact": new_loan_impact,
            "methodology": {
                "description": "Risk score computed from weighted analysis of debt burden, expense load, savings capacity, emergency buffer, and monthly surplus indicators.",
                "thresholds": self.THRESHOLDS,
            }
        }

    def detect_anomalies(self, monthly_data: list) -> dict:
        """
        Detect spending anomalies using Z-score method.
        monthly_data: list of dicts, each {category: amount}
        """
        if len(monthly_data) < 3:
            return {"anomalies": [], "message": "Insufficient data for anomaly detection (need 3+ months)"}

        # Aggregate by category
        categories = set()
        for month in monthly_data:
            categories.update(month.keys())

        anomalies = []
        category_stats = {}

        for category in categories:
            values = [m.get(category, 0) for m in monthly_data]
            mean_val = np.mean(values)
            std_val = np.std(values)

            category_stats[category] = {
                "mean": round(float(mean_val), 2),
                "std": round(float(std_val), 2),
                "values": [float(v) for v in values],
            }

            # Check latest month for anomalies
            latest = values[-1]
            if std_val > 0:
                z_score = (latest - mean_val) / std_val
                if abs(z_score) > 2:
                    direction = "increase" if z_score > 0 else "decrease"
                    anomalies.append({
                        "category": category,
                        "current_value": float(latest),
                        "expected_value": round(float(mean_val), 2),
                        "z_score": round(float(z_score), 2),
                        "direction": direction,
                        "severity": "high" if abs(z_score) > 3 else "medium",
                        "message": f"Unusual {direction} in {category}: ₹{latest:,.0f} vs average ₹{mean_val:,.0f}"
                    })

        return {
            "anomalies": anomalies,
            "category_stats": category_stats,
            "months_analyzed": len(monthly_data),
        }
