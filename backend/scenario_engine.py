"""
Module 4: Loan / Financial Scenario Simulator
The "What-If" engine — the star feature.
"""

from financial_engine import FinancialEngine


class ScenarioEngine:
    """
    Simulates financial scenarios by applying loan/decision changes
    to a user's financial profile and showing before/after impact.
    """

    def __init__(self):
        self.engine = FinancialEngine()

    def simulate(self, analysis: dict, loans: list) -> dict:
        """
        Simulate impact of one or more loans on the financial profile.
        Returns before/after comparison and monthly projections.
        """
        income = analysis["income"]["monthly_income"]
        current_expenses = analysis["expenses"]["total_expenses"]
        current_surplus = analysis["cash_flow"]["monthly_surplus"]
        current_dti = analysis["ratios"]["debt_to_income"]
        current_emi = analysis["debt"]["existing_emi"]
        current_savings = analysis["emergency"]["savings"]

        scenarios = []
        for loan in loans:
            new_emi = self.engine.calculate_emi(
                loan["loan_amount"],
                loan["interest_rate"],
                loan["tenure_years"]
            )
            total_interest = self.engine.calculate_total_interest(
                loan["loan_amount"], new_emi, loan["tenure_years"]
            )
            total_repayment = loan["loan_amount"] + total_interest
            processing_fee = loan.get("processing_fee", 0)

            # New financial metrics
            new_total_emi = current_emi + new_emi
            new_total_expenses = current_expenses + new_emi
            new_surplus = income - new_total_expenses
            new_dti = round((
                (analysis["debt"]["total_debt_payments"] + new_emi) / income * 100
            ), 1) if income > 0 else 0
            new_emi_burden = round((new_total_emi / income * 100), 1) if income > 0 else 0
            new_expense_ratio = round((new_total_expenses / income * 100), 1) if income > 0 else 0
            new_savings_rate = round((new_surplus / income * 100), 1) if income > 0 else 0

            # Monthly projection (cash flow over tenure)
            months = int(loan["tenure_years"] * 12)
            projections = []
            cumulative_interest = 0
            remaining_principal = loan["loan_amount"]
            monthly_rate = loan["interest_rate"] / (12 * 100) if loan["interest_rate"] > 0 else 0
            projected_savings = current_savings

            for month in range(1, min(months + 1, 61)):  # Cap at 60 months for display
                if monthly_rate > 0:
                    interest_component = remaining_principal * monthly_rate
                    principal_component = new_emi - interest_component
                else:
                    interest_component = 0
                    principal_component = new_emi

                remaining_principal = max(0, remaining_principal - principal_component)
                cumulative_interest += interest_component

                # Projected savings growth (assuming surplus is saved)
                projected_savings += new_surplus

                projections.append({
                    "month": month,
                    "surplus": round(new_surplus, 2),
                    "remaining_principal": round(remaining_principal, 2),
                    "cumulative_interest": round(cumulative_interest, 2),
                    "projected_savings": round(projected_savings, 2),
                    "total_emi_paid": round(new_emi * month, 2),
                })

            # Determine impact severity
            if new_surplus < 0:
                impact_severity = "critical"
            elif new_surplus < 5000:
                impact_severity = "high"
            elif new_dti > 35:
                impact_severity = "medium"
            else:
                impact_severity = "low"

            scenario = {
                "label": loan.get("label", "Loan"),
                "loan": {
                    "amount": loan["loan_amount"],
                    "interest_rate": loan["interest_rate"],
                    "tenure_years": loan["tenure_years"],
                    "processing_fee": processing_fee,
                },
                "calculations": {
                    "new_emi": round(new_emi, 2),
                    "total_interest": round(total_interest, 2),
                    "total_repayment": round(total_repayment, 2),
                    "effective_cost": round(total_interest + processing_fee, 2),
                },
                "before": {
                    "monthly_emi": current_emi,
                    "monthly_expenses": current_expenses,
                    "monthly_surplus": current_surplus,
                    "debt_to_income": current_dti,
                    "emi_burden": analysis["ratios"]["emi_burden"],
                    "expense_ratio": analysis["ratios"]["expense_to_income"],
                    "savings_rate": analysis["ratios"]["savings_rate"],
                },
                "after": {
                    "monthly_emi": round(new_total_emi, 2),
                    "monthly_expenses": round(new_total_expenses, 2),
                    "monthly_surplus": round(new_surplus, 2),
                    "debt_to_income": new_dti,
                    "emi_burden": new_emi_burden,
                    "expense_ratio": new_expense_ratio,
                    "savings_rate": new_savings_rate,
                },
                "changes": {
                    "surplus_change": round(new_surplus - current_surplus, 2),
                    "surplus_change_pct": round(
                        ((new_surplus - current_surplus) / current_surplus * 100), 1
                    ) if current_surplus != 0 else 0,
                    "dti_change": round(new_dti - current_dti, 1),
                    "expense_increase": round(new_emi, 2),
                },
                "impact_severity": impact_severity,
                "projections": projections,
            }

            scenarios.append(scenario)

        return {
            "scenarios": scenarios,
            "current_profile": {
                "income": income,
                "expenses": current_expenses,
                "surplus": current_surplus,
                "dti": current_dti,
                "emi": current_emi,
            }
        }

    def compare(self, analysis: dict, loan_a: dict, loan_b: dict) -> dict:
        """
        Compare two loan offers side by side with trade-off analysis.
        """
        # Simulate both
        result_a = self.simulate(analysis, [loan_a])
        result_b = self.simulate(analysis, [loan_b])

        scenario_a = result_a["scenarios"][0]
        scenario_b = result_b["scenarios"][0]

        # Trade-off analysis
        trade_offs = []

        # EMI comparison
        emi_a = scenario_a["calculations"]["new_emi"]
        emi_b = scenario_b["calculations"]["new_emi"]
        if emi_a < emi_b:
            trade_offs.append({
                "aspect": "Monthly EMI",
                "advantage": "A",
                "detail": f"{loan_a.get('label', 'Loan A')} has lower EMI (₹{emi_a:,.0f} vs ₹{emi_b:,.0f})"
            })
        elif emi_b < emi_a:
            trade_offs.append({
                "aspect": "Monthly EMI",
                "advantage": "B",
                "detail": f"{loan_b.get('label', 'Loan B')} has lower EMI (₹{emi_b:,.0f} vs ₹{emi_a:,.0f})"
            })

        # Total interest
        interest_a = scenario_a["calculations"]["total_interest"]
        interest_b = scenario_b["calculations"]["total_interest"]
        if interest_a < interest_b:
            trade_offs.append({
                "aspect": "Total Interest",
                "advantage": "A",
                "detail": f"{loan_a.get('label', 'Loan A')} saves ₹{(interest_b - interest_a):,.0f} in interest"
            })
        elif interest_b < interest_a:
            trade_offs.append({
                "aspect": "Total Interest",
                "advantage": "B",
                "detail": f"{loan_b.get('label', 'Loan B')} saves ₹{(interest_a - interest_b):,.0f} in interest"
            })

        # Total cost (interest + fees)
        cost_a = scenario_a["calculations"]["effective_cost"]
        cost_b = scenario_b["calculations"]["effective_cost"]
        if cost_a < cost_b:
            trade_offs.append({
                "aspect": "Total Cost",
                "advantage": "A",
                "detail": f"{loan_a.get('label', 'Loan A')} has lower total cost (₹{cost_a:,.0f} vs ₹{cost_b:,.0f})"
            })
        elif cost_b < cost_a:
            trade_offs.append({
                "aspect": "Total Cost",
                "advantage": "B",
                "detail": f"{loan_b.get('label', 'Loan B')} has lower total cost (₹{cost_b:,.0f} vs ₹{cost_a:,.0f})"
            })

        # Surplus impact
        surplus_a = scenario_a["after"]["monthly_surplus"]
        surplus_b = scenario_b["after"]["monthly_surplus"]
        if surplus_a > surplus_b:
            trade_offs.append({
                "aspect": "Monthly Surplus",
                "advantage": "A",
                "detail": f"{loan_a.get('label', 'Loan A')} leaves higher monthly surplus (₹{surplus_a:,.0f} vs ₹{surplus_b:,.0f})"
            })
        elif surplus_b > surplus_a:
            trade_offs.append({
                "aspect": "Monthly Surplus",
                "advantage": "B",
                "detail": f"{loan_b.get('label', 'Loan B')} leaves higher monthly surplus (₹{surplus_b:,.0f} vs ₹{surplus_a:,.0f})"
            })

        # Tenure
        tenure_a = loan_a["tenure_years"]
        tenure_b = loan_b["tenure_years"]
        if tenure_a < tenure_b:
            trade_offs.append({
                "aspect": "Repayment Period",
                "advantage": "A",
                "detail": f"{loan_a.get('label', 'Loan A')} has shorter tenure ({tenure_a} vs {tenure_b} years)"
            })
        elif tenure_b < tenure_a:
            trade_offs.append({
                "aspect": "Repayment Period",
                "advantage": "B",
                "detail": f"{loan_b.get('label', 'Loan B')} has shorter tenure ({tenure_b} vs {tenure_a} years)"
            })

        return {
            "loan_a": scenario_a,
            "loan_b": scenario_b,
            "trade_offs": trade_offs,
            "summary": {
                "emi_difference": round(abs(emi_a - emi_b), 2),
                "interest_difference": round(abs(interest_a - interest_b), 2),
                "cost_difference": round(abs(cost_a - cost_b), 2),
            }
        }
