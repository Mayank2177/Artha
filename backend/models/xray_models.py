from pydantic import BaseModel, Field
from typing import List, Optional


# ── Individual fund holding after extraction ───────────────────────────────
class Transaction(BaseModel):
    """Single buy/sell transaction extracted from CAMS/KFintech PDF."""
    fund_name: str
    date: str                        # ISO format: YYYY-MM-DD
    amount: float                    # Positive = purchase, Negative = redemption
    units: Optional[float] = None    # Units transacted (may not always be present)
    nav: Optional[float] = None      # NAV on transaction date


class FundHolding(BaseModel):
    """Aggregated holding for one fund after processing all transactions."""
    fund_name: str
    current_value: float             # Current market value in INR
    total_invested: float            # Total amount invested (sum of purchases)
    units_held: float
    expense_ratio: float             # Annual expense ratio as a percentage e.g. 1.25
    category: Optional[str] = None   # Large Cap, Flexi Cap, Mid Cap, Debt, etc.
    xirr: Optional[float] = None     # Calculated after transactions are processed


class OverlapPair(BaseModel):
    """Overlap between two funds."""
    fund_a: str
    fund_b: str
    overlap_percentage: float        # 0–100
    common_stocks: List[str]         # Names of overlapping stocks


# ── Request ────────────────────────────────────────────────────────────────
class XRayInput(BaseModel):
    """
    The frontend sends raw extracted PDF text as a string.
    pdfplumber runs on the backend before this model is populated.
    The file upload endpoint extracts text, then passes it here.
    """
    pdf_text: str = Field(..., description="Raw text extracted from CAMS/KFintech PDF")
    user_email: str | None = Field(None, description="Optional email to save the plan to the database")


# ── Response ───────────────────────────────────────────────────────────────
class ExpenseRatioDrag(BaseModel):
    """How much the user loses to fees vs a comparable index fund."""
    fund_name: str
    fund_expense_ratio: float
    index_expense_ratio: float       # Benchmark: Nifty 50 index fund ~ 0.10%
    corpus: float
    years_held: float
    drag_amount: float               # Total rupee loss to excess fees


class XRayResponse(BaseModel):
    """Full portfolio X-Ray response sent back to React frontend."""

    # Portfolio table — one row per fund
    holdings: List[FundHolding]

    # Aggregate metrics
    total_portfolio_value: float
    total_invested: float
    overall_xirr: float              # XIRR across entire portfolio (all cashflows combined)
    portfolio_gain_loss: float       # total_portfolio_value - total_invested
    gain_loss_percentage: float

    # Analysis
    overlaps: List[OverlapPair]      # All fund pairs with overlap > 40%
    expense_drag: List[ExpenseRatioDrag]
    total_expense_drag: float        # Sum of all drag_amount values

    # AI output
    ai_advice: str                   # Full advisor narrative from LLaMA 3.3 70B

    # Meta
    funds_count: int
    high_overlap_warning: bool       # True if any pair has overlap > 60%
    rebalancing_needed: bool         # True if AI flags consolidation required