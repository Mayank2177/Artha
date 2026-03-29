from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User, Portfolio
from models.xray_models import (
    XRayInput, XRayResponse, Transaction,
    FundHolding, OverlapPair, ExpenseRatioDrag
)
from calculators.xirr_engine import (
    calculate_fund_xirr,
    calculate_portfolio_xirr,
    calculate_years_held,
    calculate_expense_drag,
    build_fund_holdings
)
from utils.overlap_dict import (
    analyze_portfolio_overlaps,
    FUND_EXPENSE_RATIOS,
    DEFAULT_EXPENSE_RATIO,
    INDEX_EXPENSE_RATIO
)
from utils.pdf_extractor import extract_text_from_bytes as extract_text_from_pdf
from ai.prompts.xray_extract_prompt import build_extraction_prompt, build_fallback_prompt
from ai.prompts.xray_prompt import build_xray_prompt
from ai.groq_client import get_groq_client
import json
import re

router = APIRouter()


# ── Helpers ─────────────────────────────────────────────────────

def clean_json_response(raw: str) -> str:
    """
    Strips markdown code fences if LLaMA wraps JSON in ```json ... ```
    Also strips any text before the first { and after the last }
    """
    # Remove code fences
    raw = re.sub(r"```json", "", raw)
    raw = re.sub(r"```", "", raw)

    # Extract only the JSON object
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in model response")

    return raw[start:end].strip()


def parse_extracted_json(raw_response: str) -> tuple[list[Transaction], dict[str, float]]:
    """
    Parses the JSON returned by the extraction prompt.
    Returns (transactions list, current_values dict).
    Raises ValueError if parsing fails — caller handles fallback.
    """
    cleaned = clean_json_response(raw_response)
    data = json.loads(cleaned)

    transactions = []
    for t in data.get("transactions", []):
        try:
            transactions.append(Transaction(
                fund_name=t["fund_name"],
                date=t["date"],
                amount=float(t["amount"]),
                units=float(t["units"]) if t.get("units") else None,
                nav=float(t["nav"]) if t.get("nav") else None,
            ))
        except (KeyError, TypeError, ValueError):
            continue  # Skip malformed transactions silently

    current_values: dict[str, float] = {
        k: float(v)
        for k, v in data.get("current_values", {}).items()
    }

    return transactions, current_values


def group_transactions_by_fund(
    transactions: list[Transaction]
) -> dict[str, list[Transaction]]:
    """Groups flat transaction list into dict keyed by fund name."""
    grouped: dict[str, list[Transaction]] = {}
    for txn in transactions:
        if txn.fund_name not in grouped:
            grouped[txn.fund_name] = []
        grouped[txn.fund_name].append(txn)
    return grouped


# ── PDF Upload Endpoint ──────────────────────────────────────────

from fastapi import Form

@router.post("/mf-xray/upload")
async def upload_pdf(file: UploadFile = File(...), password: str = Form(None)):
    """
    Step 0 — Accepts the raw PDF upload from React Dropzone and an optional password.
    Extracts text using pdfplumber and returns it as a string.
    React then sends this text to /mf-xray for analysis.

    Kept separate so the frontend can show a progress state:
    1. Upload + extract (this endpoint)
    2. Analyze (the main endpoint below)
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    try:
        pdf_bytes = await file.read()
        raw_text = extract_text_from_pdf(pdf_bytes, password=password)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF extraction failed: {str(e)}")

    if not raw_text or len(raw_text.strip()) < 100:
        raise HTTPException(
            status_code=422,
            detail="PDF appears to be empty or scanned. Please upload a text-based CAMS/KFintech statement."
        )

    return {"pdf_text": raw_text}


# ── Main Analysis Endpoint ───────────────────────────────────────

@router.post("/mf-xray", response_model=XRayResponse)
async def mf_xray(payload: XRayInput, db: Session = Depends(get_db)):
    """
    Main MF Portfolio X-Ray endpoint.
    Follows the Collect → Compute → Advise pattern.

    COLLECT  — receives raw PDF text from frontend
    COMPUTE  — extracts transactions via AI, runs XIRR + overlap + expense math
    ADVISE   — sends computed data to LLaMA 3.3 70B, returns full advisor narrative
    """

    # ── STEP 1: EXTRACT transactions from PDF text via LLaMA 3.1 8B ──
    extract_client = get_groq_client()

    extract_prompt = build_extraction_prompt(payload.pdf_text)

    try:
        extract_response = extract_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": extract_prompt}],
            max_tokens=4000,
            temperature=0.0,  # Zero temp for deterministic JSON extraction
        )
        raw_json = extract_response.choices[0].message.content
        transactions, current_values = parse_extracted_json(raw_json)

    except (ValueError, json.JSONDecodeError):
        # Main extraction failed — try fallback prompt
        try:
            fallback_prompt = build_fallback_prompt(payload.pdf_text)
            fallback_response = extract_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": fallback_prompt}],
                max_tokens=2000,
                temperature=0.0,
            )
            raw_fallback = fallback_response.choices[0].message.content
            cleaned = clean_json_response(raw_fallback)
            fallback_data = json.loads(cleaned)

            # Build minimal holdings from fallback data
            holdings = []
            for f in fallback_data.get("funds", []):
                holdings.append(FundHolding(
                    fund_name=f["fund_name"],
                    current_value=float(f.get("current_value", 0)),
                    total_invested=float(f.get("total_invested", 0)),
                    units_held=0.0,
                    expense_ratio=FUND_EXPENSE_RATIOS.get(
                        f["fund_name"], DEFAULT_EXPENSE_RATIO
                    ),
                    xirr=None,
                ))

            # Skip XIRR in fallback — not enough data
            return _build_response_from_holdings(holdings, [], overall_xirr=0.0)

        except Exception:
            raise HTTPException(
                status_code=422,
                detail="Could not extract transaction data from this PDF. "
                       "Please ensure it is a CAMS or KFintech consolidated statement."
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction error: {str(e)}")

    if not transactions and not current_values:
        raise HTTPException(
            status_code=422,
            detail="No transactions found in the PDF. Please upload a valid portfolio statement."
        )

    # ── STEP 2: COMPUTE — run all math ───────────────────────────

    # Group transactions by fund
    grouped = group_transactions_by_fund(transactions)

    # If current_values not extracted, estimate from transactions
    if not current_values:
        for fund_name, txns in grouped.items():
            current_values[fund_name] = sum(
                txn.amount for txn in txns if txn.amount > 0
            ) * 1.15  # Rough 15% appreciation estimate as fallback

    # Build FundHolding objects with per-fund XIRR
    holdings = build_fund_holdings(grouped, current_values)

    # Overall portfolio XIRR across all transactions
    total_portfolio_value = sum(h.current_value for h in holdings)
    overall_xirr = calculate_portfolio_xirr(transactions, total_portfolio_value)

    # Overlap analysis
    fund_names = [h.fund_name for h in holdings]
    raw_overlaps = analyze_portfolio_overlaps(fund_names)
    overlaps = [
        OverlapPair(
            fund_a=o["fund_a"],
            fund_b=o["fund_b"],
            overlap_percentage=o["overlap_percentage"],
            common_stocks=o["common_stocks"],
        )
        for o in raw_overlaps
    ]

    # Expense ratio drag per fund
    expense_drag = []
    for h in holdings:
        years = calculate_years_held(grouped.get(h.fund_name, []))
        drag = calculate_expense_drag(h.fund_name, h.current_value, years)
        expense_drag.append(drag)

    total_expense_drag = round(sum(d.drag_amount for d in expense_drag), 2)
    total_invested = sum(h.total_invested for h in holdings)
    gain_loss = total_portfolio_value - total_invested
    gain_loss_pct = (gain_loss / total_invested * 100) if total_invested > 0 else 0.0

    # ── STEP 3: ADVISE — LLaMA 3.3 70B generates the narrative ──
    advice_client = get_groq_client()

    advice_prompt = build_xray_prompt(
        holdings=holdings,
        overlaps=overlaps,
        expense_drag=expense_drag,
        overall_xirr=overall_xirr,
        total_portfolio_value=total_portfolio_value,
        total_invested=total_invested,
        total_expense_drag=total_expense_drag,
    )

    try:
        advice_response = advice_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": advice_prompt}],
            max_tokens=1000,
            temperature=0.4,  # Slight creativity for natural advisor tone
        )
        ai_advice = advice_response.choices[0].message.content.strip()
    except Exception as e:
        # Don't fail the whole request if AI advice fails
        # Return computed data with a fallback message
        ai_advice = (
            "Portfolio analysis complete. Your XIRR and overlap data are shown above. "
            "AI narrative advice is temporarily unavailable — please try again in a moment."
        )

    # ── SAVE TO DB (Optional) ─────────────────────────────────────
    if payload.user_email:
        user = db.query(User).filter(User.email == payload.user_email).first()
        if user:
            db_result = Portfolio(
                user_id=user.id,
                total_value=total_portfolio_value,
                xirr=overall_xirr,
                fund_count=len(holdings)
            )
            db.add(db_result)
            db.commit()

    # ── STEP 4: BUILD and return final response ───────────────────
    return XRayResponse(
        holdings=holdings,
        total_portfolio_value=round(total_portfolio_value, 2),
        total_invested=round(total_invested, 2),
        overall_xirr=overall_xirr,
        portfolio_gain_loss=round(gain_loss, 2),
        gain_loss_percentage=round(gain_loss_pct, 2),
        overlaps=overlaps,
        expense_drag=expense_drag,
        total_expense_drag=total_expense_drag,
        ai_advice=ai_advice,
        funds_count=len(holdings),
        high_overlap_warning=any(o.overlap_percentage > 60 for o in overlaps),
        rebalancing_needed=len(overlaps) > 0 or total_expense_drag > 10000,
    )

# ── Demo Endpoint ────────────────────────────────────────────────
from pydantic import BaseModel

class DemoInput(BaseModel):
    user_email: str

@router.post("/mf-xray/demo")
async def save_demo_portfolio(payload: DemoInput, db: Session = Depends(get_db)):
    """Saves the hardcoded mock frontend data to the database for testing"""
    if payload.user_email:
        user = db.query(User).filter(User.email == payload.user_email).first()
        if user:
            # 812000 value, 15.4 XIRR, 6 funds (matches frontend MOCK_PORTFOLIO)
            db_result = Portfolio(
                user_id=user.id,
                total_value=812000,
                xirr=15.4,
                fund_count=6
            )
            db.add(db_result)
            db.commit()
    return {"status": "success"}


# ── Internal helper for fallback path ───────────────────────────

def _build_response_from_holdings(
    holdings: list[FundHolding],
    overlaps: list[OverlapPair],
    overall_xirr: float,
) -> XRayResponse:
    """Used in fallback mode when full transaction extraction fails."""
    total_value = sum(h.current_value for h in holdings)
    total_invested = sum(h.total_invested for h in holdings)

    return XRayResponse(
        holdings=holdings,
        total_portfolio_value=round(total_value, 2),
        total_invested=round(total_invested, 2),
        overall_xirr=overall_xirr,
        portfolio_gain_loss=round(total_value - total_invested, 2),
        gain_loss_percentage=round(
            ((total_value - total_invested) / total_invested * 100)
            if total_invested > 0 else 0.0, 2
        ),
        overlaps=overlaps,
        expense_drag=[],
        total_expense_drag=0.0,
        ai_advice="Partial data extracted. XIRR could not be calculated — "
                  "please upload a complete CAMS/KFintech statement for full analysis.",
        funds_count=len(holdings),
        high_overlap_warning=False,
        rebalancing_needed=False,
    )

