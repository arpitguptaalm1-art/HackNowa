"""
ArthIQ — AI-Powered Personal Finance Risk & Decision Assistant
Backend API Server
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os

from financial_engine import FinancialEngine
from risk_engine import RiskEngine
from scenario_engine import ScenarioEngine
from document_parser import DocumentParser
from ai_explainer import AIExplainer

app = FastAPI(
    title="ArthIQ API",
    description="AI-Powered Personal Finance Risk & Decision Assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
financial_engine = FinancialEngine()
risk_engine = RiskEngine()
scenario_engine = ScenarioEngine()
document_parser = DocumentParser()
ai_explainer = AIExplainer()


# ─── Pydantic Models ───────────────────────────────────────────

class FinancialProfile(BaseModel):
    monthly_income: float
    rent: float = 0
    food: float = 0
    transport: float = 0
    utilities: float = 0
    subscriptions: float = 0
    existing_emi: float = 0
    credit_card_payment: float = 0
    other_expenses: float = 0
    savings: float = 0


class LoanDetails(BaseModel):
    loan_amount: float
    interest_rate: float  # annual percentage
    tenure_years: float
    processing_fee: float = 0
    label: str = "Loan"


class ScenarioRequest(BaseModel):
    profile: FinancialProfile
    loans: List[LoanDetails]


class CompareLoansRequest(BaseModel):
    profile: FinancialProfile
    loan_a: LoanDetails
    loan_b: LoanDetails


class ExplainRequest(BaseModel):
    profile: FinancialProfile
    loan: Optional[LoanDetails] = None
    risk_data: Optional[dict] = None
    scenario_data: Optional[dict] = None


class SpendingHistory(BaseModel):
    """Monthly spending data for anomaly detection"""
    months: List[dict]  # each dict has category: amount


# ─── Health Check ──────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "running", "app": "ArthIQ API", "version": "1.0.0"}


# ─── Module 1: Document Intelligence ──────────────────────────

@app.post("/api/document/parse")
async def parse_document(file: UploadFile = File(...)):
    """Parse uploaded financial document (salary slip, loan doc, etc.)"""
    try:
        contents = await file.read()
        filename = file.filename or "document"

        result = document_parser.parse(contents, filename)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Module 2: Financial Intelligence ─────────────────────────

@app.post("/api/financial/analyze")
def analyze_financials(profile: FinancialProfile):
    """Analyze financial profile and compute key metrics"""
    data = profile.dict()
    analysis = financial_engine.analyze(data)
    return {"success": True, "data": analysis}


# ─── Module 3: Risk Detection ─────────────────────────────────

@app.post("/api/risk/assess")
def assess_risk(profile: FinancialProfile, loan: Optional[LoanDetails] = None):
    """Assess financial risk with optional new loan consideration"""
    profile_data = profile.dict()
    loan_data = loan.dict() if loan else None

    analysis = financial_engine.analyze(profile_data)
    risk = risk_engine.assess(analysis, loan_data)
    return {"success": True, "data": risk}


@app.post("/api/risk/anomaly")
def detect_anomalies(history: SpendingHistory):
    """Detect spending anomalies from historical data"""
    anomalies = risk_engine.detect_anomalies(history.months)
    return {"success": True, "data": anomalies}


# ─── Module 4: Scenario Simulator ─────────────────────────────

@app.post("/api/scenario/simulate")
def simulate_scenario(request: ScenarioRequest):
    """Simulate financial impact of one or more loans"""
    profile_data = request.profile.dict()
    loans_data = [loan.dict() for loan in request.loans]

    analysis = financial_engine.analyze(profile_data)
    scenarios = scenario_engine.simulate(analysis, loans_data)
    return {"success": True, "data": scenarios}


@app.post("/api/scenario/compare")
def compare_loans(request: CompareLoansRequest):
    """Compare two loan offers side by side"""
    profile_data = request.profile.dict()
    loan_a = request.loan_a.dict()
    loan_b = request.loan_b.dict()

    analysis = financial_engine.analyze(profile_data)
    comparison = scenario_engine.compare(analysis, loan_a, loan_b)
    return {"success": True, "data": comparison}


# ─── Module 5: AI Explanation ──────────────────────────────────

@app.post("/api/explain")
async def explain(request: ExplainRequest):
    """Generate AI-powered explanation of financial analysis"""
    profile_data = request.profile.dict()
    loan_data = request.loan.dict() if request.loan else None

    analysis = financial_engine.analyze(profile_data)
    risk = risk_engine.assess(analysis, loan_data)

    scenario_data = None
    if loan_data:
        scenario_data = scenario_engine.simulate(analysis, [loan_data])

    explanation = await ai_explainer.explain(
        analysis=analysis,
        risk=risk,
        scenario=scenario_data,
        loan=loan_data
    )

    return {"success": True, "data": {"explanation": explanation}}


# ─── Full Analysis Pipeline ───────────────────────────────────

@app.post("/api/full-analysis")
async def full_analysis(request: ScenarioRequest):
    """Run the complete ArthIQ analysis pipeline"""
    profile_data = request.profile.dict()
    loans_data = [loan.dict() for loan in request.loans]

    # Step 1: Financial Analysis
    analysis = financial_engine.analyze(profile_data)

    # Step 2: Risk Assessment (with first loan if available)
    first_loan = loans_data[0] if loans_data else None
    risk = risk_engine.assess(analysis, first_loan)

    # Step 3: Scenario Simulation
    scenarios = scenario_engine.simulate(analysis, loans_data) if loans_data else None

    # Step 4: AI Explanation
    explanation = await ai_explainer.explain(
        analysis=analysis,
        risk=risk,
        scenario=scenarios,
        loan=first_loan
    )

    return {
        "success": True,
        "data": {
            "analysis": analysis,
            "risk": risk,
            "scenarios": scenarios,
            "explanation": explanation
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
