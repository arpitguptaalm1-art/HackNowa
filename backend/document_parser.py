"""
Module 1: Document Parser
Extracts structured data from uploaded financial documents (PDF).
Uses pdfplumber for text extraction + regex for data parsing.
"""

import re
import pdfplumber
import io


class DocumentParser:
    """
    Parses financial documents (salary slips, loan offers, bank statements)
    and extracts structured data using pattern matching.
    """

    def parse(self, file_bytes: bytes, filename: str) -> dict:
        """Parse document and return structured data."""
        text = self._extract_text(file_bytes, filename)

        if not text.strip():
            return {
                "type": "unknown",
                "raw_text": "",
                "message": "Could not extract text from document. Try a text-based PDF."
            }

        # Detect document type and parse accordingly
        doc_type = self._detect_type(text)

        if doc_type == "salary_slip":
            data = self._parse_salary_slip(text)
        elif doc_type == "loan_offer":
            data = self._parse_loan_document(text)
        elif doc_type == "bank_statement":
            data = self._parse_bank_statement(text)
        else:
            data = self._parse_generic(text)

        data["document_type"] = doc_type
        data["raw_text"] = text[:2000]  # first 2000 chars for reference
        return data

    def _extract_text(self, file_bytes: bytes, filename: str) -> str:
        """Extract text from PDF or plain text file."""
        ext = filename.lower().split(".")[-1] if "." in filename else ""

        if ext == "pdf":
            try:
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    pages_text = []
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            pages_text.append(page_text)
                    return "\n".join(pages_text)
            except Exception as e:
                return ""
        elif ext in ("txt", "csv", "text"):
            try:
                return file_bytes.decode("utf-8")
            except:
                return file_bytes.decode("latin-1", errors="ignore")
        else:
            # Try as text first, then PDF
            try:
                return file_bytes.decode("utf-8")
            except:
                try:
                    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                        pages_text = []
                        for page in pdf.pages:
                            page_text = page.extract_text()
                            if page_text:
                                pages_text.append(page_text)
                        return "\n".join(pages_text)
                except:
                    return ""

    def _detect_type(self, text: str) -> str:
        """Detect document type from content."""
        text_lower = text.lower()

        salary_keywords = [
            "salary", "payslip", "pay slip", "basic salary", "hra",
            "allowance", "deduction", "provident fund", "pf",
            "gross salary", "net salary", "net pay", "take home",
            "earnings", "employer", "employee"
        ]
        loan_keywords = [
            "loan", "emi", "interest rate", "tenure", "principal",
            "disbursement", "processing fee", "repayment",
            "sanction", "borrower", "lender", "rate of interest"
        ]
        bank_keywords = [
            "statement", "account number", "balance", "credit",
            "debit", "transaction", "withdrawal", "deposit",
            "opening balance", "closing balance"
        ]

        salary_score = sum(1 for kw in salary_keywords if kw in text_lower)
        loan_score = sum(1 for kw in loan_keywords if kw in text_lower)
        bank_score = sum(1 for kw in bank_keywords if kw in text_lower)

        scores = {"salary_slip": salary_score, "loan_offer": loan_score, "bank_statement": bank_score}
        best = max(scores, key=scores.get)

        return best if scores[best] >= 2 else "generic"

    def _parse_salary_slip(self, text: str) -> dict:
        """Extract salary components from salary slip."""
        data = {
            "type": "salary_slip",
            "components": {},
            "deductions": {},
        }

        # Common patterns for Indian salary slips
        patterns = {
            "basic_salary": [
                r"basic\s*(?:salary|pay)?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "hra": [
                r"(?:hra|house\s*rent\s*allowance)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "special_allowance": [
                r"special\s*allowance\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "dearness_allowance": [
                r"(?:da|dearness\s*allowance)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "conveyance": [
                r"conveyance\s*(?:allowance)?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "medical": [
                r"medical\s*(?:allowance)?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
        }

        deduction_patterns = {
            "pf": [
                r"(?:pf|provident\s*fund|epf)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "professional_tax": [
                r"(?:professional\s*tax|pt)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "income_tax": [
                r"(?:income\s*tax|tds|tax\s*deducted)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "esi": [
                r"(?:esi|employee\s*state\s*insurance)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
        }

        total_patterns = {
            "gross_salary": [
                r"gross\s*(?:salary|pay|earnings?)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
                r"total\s*earnings?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "net_salary": [
                r"net\s*(?:salary|pay|take\s*home)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
                r"take\s*home\s*(?:pay|salary)?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "total_deductions": [
                r"total\s*deductions?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
        }

        for key, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    data["components"][key] = float(match.group(1).replace(",", ""))
                    break

        for key, pattern_list in deduction_patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    data["deductions"][key] = float(match.group(1).replace(",", ""))
                    break

        for key, pattern_list in total_patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    data[key] = float(match.group(1).replace(",", ""))
                    break

        # Calculate totals if not found
        if "gross_salary" not in data and data["components"]:
            data["gross_salary"] = sum(data["components"].values())

        if "total_deductions" not in data and data["deductions"]:
            data["total_deductions"] = sum(data["deductions"].values())

        if "net_salary" not in data:
            gross = data.get("gross_salary", 0)
            deductions = data.get("total_deductions", 0)
            if gross > 0:
                data["net_salary"] = gross - deductions

        # Extract employer name
        employer_match = re.search(
            r"(?:employer|company|organisation|organization)\s*[:\-]?\s*(.+)",
            text, re.IGNORECASE
        )
        if employer_match:
            data["employer"] = employer_match.group(1).strip()

        return data

    def _parse_loan_document(self, text: str) -> dict:
        """Extract loan details from loan offer/document."""
        data = {"type": "loan_offer"}

        loan_patterns = {
            "loan_amount": [
                r"(?:loan|principal|sanction)\s*(?:amount)?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
                r"(?:amount\s*(?:of\s*)?(?:loan|credit))\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "interest_rate": [
                r"(?:interest|rate)\s*(?:of\s*interest|rate)?\s*[:\-]?\s*([\d.]+)\s*%",
                r"(?:roi|rate)\s*[:\-]?\s*([\d.]+)\s*%?\s*(?:p\.?a\.?|per\s*annum)?",
            ],
            "tenure_months": [
                r"tenure\s*[:\-]?\s*(\d+)\s*months?",
                r"repayment\s*(?:period)?\s*[:\-]?\s*(\d+)\s*months?",
            ],
            "tenure_years": [
                r"tenure\s*[:\-]?\s*(\d+)\s*years?",
                r"repayment\s*(?:period)?\s*[:\-]?\s*(\d+)\s*years?",
            ],
            "emi": [
                r"emi\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
                r"monthly\s*(?:installment|payment)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
            "processing_fee": [
                r"processing\s*fee\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            ],
        }

        for key, pattern_list in loan_patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    val = match.group(1).replace(",", "")
                    data[key] = float(val)
                    break

        # Convert tenure months to years if needed
        if "tenure_months" in data and "tenure_years" not in data:
            data["tenure_years"] = data["tenure_months"] / 12

        if "tenure_years" not in data and "tenure_months" not in data:
            data["tenure_years"] = 5  # default

        return data

    def _parse_bank_statement(self, text: str) -> dict:
        """Extract basic info from bank statement."""
        data = {"type": "bank_statement", "transactions": []}

        # Try to find account number
        acct_match = re.search(r"(?:account\s*(?:no|number|#))\s*[:\-]?\s*(\d+)", text, re.IGNORECASE)
        if acct_match:
            data["account_number"] = acct_match.group(1)

        # Try to find balances
        balance_patterns = {
            "opening_balance": r"opening\s*balance\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
            "closing_balance": r"closing\s*balance\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)",
        }

        for key, pattern in balance_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data[key] = float(match.group(1).replace(",", ""))

        # Try to find total credits/debits
        credit_match = re.search(
            r"total\s*credit\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE
        )
        debit_match = re.search(
            r"total\s*debit\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE
        )

        if credit_match:
            data["total_credits"] = float(credit_match.group(1).replace(",", ""))
        if debit_match:
            data["total_debits"] = float(debit_match.group(1).replace(",", ""))

        return data

    def _parse_generic(self, text: str) -> dict:
        """Generic parser — extract all monetary values found."""
        data = {"type": "generic", "extracted_amounts": []}

        # Find all monetary values
        money_patterns = re.findall(
            r"[₹Rs.]*\s*([\d,]+(?:\.\d+)?)\s*(?:/-|rupees?)?",
            text, re.IGNORECASE
        )

        for val in money_patterns:
            try:
                amount = float(val.replace(",", ""))
                if amount > 0:
                    data["extracted_amounts"].append(amount)
            except ValueError:
                continue

        data["extracted_amounts"] = sorted(set(data["extracted_amounts"]), reverse=True)[:20]
        return data
