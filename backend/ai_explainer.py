"""
Module 5: AI Explainer
Uses Google Gemini to generate human-readable explanations
of financial analysis results. The LLM receives pre-computed
data — it explains, it doesn't calculate.
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()


class AIExplainer:
    """
    Generates natural-language explanations using Gemini.
    Architecture: Calculations → Risk Detection → Scenario → LLM Explanation
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-2.0-flash")
            except Exception as e:
                print(f"Gemini init error: {e}")

    async def explain(
        self,
        analysis: dict,
        risk: dict,
        scenario: dict = None,
        loan: dict = None,
    ) -> str:
        """Generate explanation from pre-computed financial data."""

        if not self.model:
            return self._fallback_explanation(analysis, risk, scenario, loan)

        prompt = self._build_prompt(analysis, risk, scenario, loan)

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._fallback_explanation(analysis, risk, scenario, loan)

    def _build_prompt(self, analysis, risk, scenario, loan):
        """Build structured prompt for LLM."""
        prompt = """You are ArthIQ's AI financial insight engine. Your job is to explain 
pre-computed financial analysis in clear, conversational language. 

CRITICAL RULES:
- Do NOT invent numbers. Only use the data provided below.
- Do NOT give financial advice or recommend specific actions.
- Instead, explain the trade-offs, risks, and implications clearly.
- Use ₹ for currency. Format numbers with Indian numbering (lakhs/crores).
- Be concise. Use bullet points and short paragraphs.
- Use plain language a non-expert can understand.
- Highlight both positive signals and concerns.

"""

        prompt += "## FINANCIAL ANALYSIS DATA\n\n"
        prompt += f"### Income & Cash Flow\n"
        prompt += f"- Monthly Income: ₹{analysis['income']['monthly_income']:,.0f}\n"
        prompt += f"- Total Expenses: ₹{analysis['expenses']['total_expenses']:,.0f}\n"
        prompt += f"- Monthly Surplus: ₹{analysis['cash_flow']['monthly_surplus']:,.0f}\n"
        prompt += f"- Savings Rate: {analysis['ratios']['savings_rate']}%\n\n"

        prompt += f"### Key Ratios\n"
        prompt += f"- Debt-to-Income: {analysis['ratios']['debt_to_income']}%\n"
        prompt += f"- Expense-to-Income: {analysis['ratios']['expense_to_income']}%\n"
        prompt += f"- EMI Burden: {analysis['ratios']['emi_burden']}%\n\n"

        prompt += f"### Health Score: {analysis['health_scores']['overall']}/100 ({analysis['health_scores']['grade']})\n\n"

        prompt += f"## RISK ASSESSMENT\n"
        prompt += f"- Overall Risk: {risk['risk_level']} ({risk['composite_score']}/100)\n\n"

        for indicator in risk.get("indicators", []):
            prompt += f"- {indicator['name']}: {indicator['level']} — {indicator['detail']}\n"

        if risk.get("signals"):
            prompt += f"\n### Risk Signals\n"
            for signal in risk["signals"]:
                prompt += f"- [{signal['severity'].upper()}] {signal['message']}\n"

        if loan and risk.get("new_loan_impact"):
            impact = risk["new_loan_impact"]
            prompt += f"\n## NEW LOAN DETAILS\n"
            prompt += f"- Loan Amount: ₹{loan['loan_amount']:,.0f}\n"
            prompt += f"- Interest Rate: {loan['interest_rate']}%\n"
            prompt += f"- Tenure: {loan['tenure_years']} years\n"
            prompt += f"- New EMI: ₹{impact['new_emi']:,.0f}\n"
            prompt += f"- Total Interest: ₹{impact['total_interest']:,.0f}\n"
            prompt += f"- New DTI: {impact['new_dti']}%\n"
            prompt += f"- New Monthly Surplus: ₹{impact['new_monthly_surplus']:,.0f}\n"
            prompt += f"- Surplus Reduction: ₹{impact['surplus_reduction']:,.0f} ({impact['surplus_reduction_pct']}%)\n"

        if scenario and scenario.get("scenarios"):
            prompt += f"\n## SCENARIO ANALYSIS\n"
            for s in scenario["scenarios"]:
                prompt += f"\n### {s['label']}\n"
                prompt += f"- Before: Surplus ₹{s['before']['monthly_surplus']:,.0f}, DTI {s['before']['debt_to_income']}%\n"
                prompt += f"- After: Surplus ₹{s['after']['monthly_surplus']:,.0f}, DTI {s['after']['debt_to_income']}%\n"
                prompt += f"- Impact: {s['impact_severity']}\n"

        prompt += """

## YOUR TASK
Based on the data above, provide:
1. **Financial Health Summary** (2-3 sentences on current standing)
2. **Key Findings** (bullet points of important observations)
3. **Risk Factors** (explain each concern in plain language)
4. **Scenario Impact** (if loan data present, explain what changes)
5. **Things to Consider** (trade-offs the user should think about — NOT advice)

Keep it under 400 words. Be direct and clear.
"""
        return prompt

    def _fallback_explanation(self, analysis, risk, scenario, loan):
        """Generate explanation without LLM when API is unavailable."""

        lines = []
        lines.append("## Financial Health Summary\n")

        health = analysis["health_scores"]
        lines.append(
            f"Your overall financial health score is **{health['overall']}/100** "
            f"(**{health['grade']}**). "
        )

        surplus = analysis["cash_flow"]["monthly_surplus"]
        income = analysis["income"]["monthly_income"]

        if surplus > 0:
            lines.append(
                f"You have a monthly surplus of **₹{surplus:,.0f}** after all expenses, "
                f"which represents **{analysis['ratios']['savings_rate']}%** of your income.\n"
            )
        else:
            lines.append(
                f"⚠️ Your monthly expenses **exceed your income** by ₹{abs(surplus):,.0f}. "
                f"This is unsustainable and needs immediate attention.\n"
            )

        # Key findings
        lines.append("## Key Findings\n")

        for indicator in risk.get("indicators", []):
            if indicator["level"] in ("High", "Critical"):
                lines.append(f"- ⚠️ **{indicator['name']}**: {indicator['detail']}")
            elif indicator["level"] == "Medium":
                lines.append(f"- ⚡ **{indicator['name']}**: {indicator['detail']}")
            else:
                lines.append(f"- ✅ **{indicator['name']}**: {indicator['detail']}")

        # Loan impact
        if loan and risk.get("new_loan_impact"):
            impact = risk["new_loan_impact"]
            lines.append(f"\n## Loan Impact Analysis\n")
            lines.append(
                f"Taking a loan of **₹{loan['loan_amount']:,.0f}** at **{loan['interest_rate']}%** "
                f"for **{loan['tenure_years']} years** would add an EMI of **₹{impact['new_emi']:,.0f}** per month."
            )
            lines.append(
                f"\n- Your monthly surplus would change from **₹{surplus:,.0f}** → **₹{impact['new_monthly_surplus']:,.0f}**"
            )
            lines.append(
                f"- Debt-to-income ratio would become **{impact['new_dti']}%**"
            )
            lines.append(
                f"- Total interest over the loan tenure: **₹{impact['total_interest']:,.0f}**"
            )

            if impact["new_monthly_surplus"] < 0:
                lines.append(
                    f"\n⚠️ **Warning**: This loan would result in negative monthly cash flow."
                )
            elif impact["new_monthly_surplus"] < 5000:
                lines.append(
                    f"\n⚡ **Note**: Remaining surplus of ₹{impact['new_monthly_surplus']:,.0f} "
                    f"leaves limited room for unexpected expenses."
                )

        # Risk signals
        if risk.get("signals"):
            lines.append(f"\n## Risk Signals\n")
            for signal in risk["signals"]:
                icon = "⚠️" if signal["type"] == "warning" else "🛑" if signal["type"] == "danger" else "✅"
                lines.append(f"- {icon} {signal['message']}")

        lines.append(
            f"\n---\n*This analysis is based on the information provided. "
            f"ArthIQ shows risks and trade-offs — financial decisions are yours to make.*"
        )

        return "\n".join(lines)
