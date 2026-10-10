"""
Module 2: Financial Intelligence Engine
Handles all deterministic financial calculations and metrics.
"""

import math


class FinancialEngine:
    """
    Computes comprehensive financial metrics from user profile data.
    This is the calculation layer — no AI/ML, pure math.
    """

    def analyze(self, profile: dict) -> dict:
        """Run full financial analysis on a user profile."""

        income = profile.get("monthly_income", 0)

        # Categorize expenses
        fixed_expenses = {
            "rent": profile.get("rent", 0),
            "existing_emi": profile.get("existing_emi", 0),
            "utilities": profile.get("utilities", 0),
            "subscriptions": profile.get("subscriptions", 0),
        }

        variable_expenses = {
            "food": profile.get("food", 0),
            "transport": profile.get("transport", 0),
            "credit_card_payment": profile.get("credit_card_payment", 0),
            "other_expenses": profile.get("other_expenses", 0),
        }

        total_fixed = sum(fixed_expenses.values())
        total_variable = sum(variable_expenses.values())
        total_expenses = total_fixed + total_variable

        # Core metrics
        monthly_surplus = income - total_expenses
        savings = profile.get("savings", 0)

        # Debt-related
        total_debt_payments = (
            profile.get("existing_emi", 0) +
            profile.get("credit_card_payment", 0)
        )

        # Key financial ratios
        savings_rate = (monthly_surplus / income * 100) if income > 0 else 0
        dti_ratio = (total_debt_payments / income * 100) if income > 0 else 0
        expense_ratio = (total_expenses / income * 100) if income > 0 else 0
        emi_burden = (profile.get("existing_emi", 0) / income * 100) if income > 0 else 0

        # Emergency buffer (months of expenses covered by savings)
        emergency_months = (savings / total_expenses) if total_expenses > 0 else 0

        # Financial health scores (0-100)
        income_stability_score = min(100, max(0, 100 - abs(expense_ratio - 50)))
        expense_load_score = max(0, 100 - expense_ratio)
        debt_load_score = max(0, 100 - (dti_ratio * 2.5))
        savings_score = min(100, savings_rate * 2)
        emergency_score = min(100, emergency_months * 16.67)  # 6 months = 100

        # Overall financial health (weighted average)
        overall_health = (
            income_stability_score * 0.15 +
            expense_load_score * 0.25 +
            debt_load_score * 0.25 +
            savings_score * 0.20 +
            emergency_score * 0.15
        )

        # Health grade
        if overall_health >= 80:
            health_grade = "Excellent"
        elif overall_health >= 65:
            health_grade = "Good"
        elif overall_health >= 50:
            health_grade = "Fair"
        elif overall_health >= 35:
            health_grade = "Concerning"
        else:
            health_grade = "Critical"

        return {
            "income": {
                "monthly_income": income,
                "annual_income": income * 12,
            },
            "expenses": {
                "fixed": fixed_expenses,
                "variable": variable_expenses,
                "total_fixed": total_fixed,
                "total_variable": total_variable,
                "total_expenses": total_expenses,
            },
            "cash_flow": {
                "monthly_surplus": monthly_surplus,
                "annual_surplus": monthly_surplus * 12,
                "surplus_percentage": round(savings_rate, 1),
            },
            "debt": {
                "total_debt_payments": total_debt_payments,
                "existing_emi": profile.get("existing_emi", 0),
                "credit_card": profile.get("credit_card_payment", 0),
            },
            "ratios": {
                "savings_rate": round(savings_rate, 1),
                "debt_to_income": round(dti_ratio, 1),
                "expense_to_income": round(expense_ratio, 1),
                "emi_burden": round(emi_burden, 1),
            },
            "emergency": {
                "savings": savings,
                "months_covered": round(emergency_months, 1),
            },
            "health_scores": {
                "income_stability": round(income_stability_score, 1),
                "expense_load": round(expense_load_score, 1),
                "debt_load": round(debt_load_score, 1),
                "savings_capacity": round(savings_score, 1),
                "emergency_buffer": round(emergency_score, 1),
                "overall": round(overall_health, 1),
                "grade": health_grade,
            }
        }

    @staticmethod
    def calculate_emi(principal: float, annual_rate: float, tenure_years: float) -> float:
        """Calculate EMI using standard reducing balance formula."""
        if annual_rate == 0:
            return principal / (tenure_years * 12) if tenure_years > 0 else 0

        monthly_rate = annual_rate / (12 * 100)
        months = int(tenure_years * 12)

        if monthly_rate == 0 or months == 0:
            return 0

        emi = principal * monthly_rate * math.pow(1 + monthly_rate, months) / \
              (math.pow(1 + monthly_rate, months) - 1)

        return round(emi, 2)

    @staticmethod
    def calculate_total_interest(principal: float, emi: float, tenure_years: float) -> float:
        """Calculate total interest paid over loan tenure."""
        months = int(tenure_years * 12)
        total_paid = emi * months
        return round(total_paid - principal, 2)

    @staticmethod
    def amortization_schedule(principal: float, annual_rate: float, tenure_years: float) -> list:
        """Generate month-by-month amortization schedule."""
        monthly_rate = annual_rate / (12 * 100) if annual_rate > 0 else 0
        months = int(tenure_years * 12)
        emi = FinancialEngine.calculate_emi(principal, annual_rate, tenure_years)

        schedule = []
        balance = principal
        total_interest_paid = 0

        for month in range(1, months + 1):
            interest_component = balance * monthly_rate
            principal_component = emi - interest_component
            balance -= principal_component
            total_interest_paid += interest_component

            schedule.append({
                "month": month,
                "emi": round(emi, 2),
                "principal": round(principal_component, 2),
                "interest": round(interest_component, 2),
                "balance": round(max(0, balance), 2),
                "total_interest_paid": round(total_interest_paid, 2),
            })

        return schedule
