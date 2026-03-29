from pyxirr import xirr
from datetime import datetime, date
from models.xray_models import Transaction, FundHolding, ExpenseRatioDrag
from utils.overlap_dict import get_overlap_percentage, get_overlapping_stocks, analyze_portfolio_overlaps
from utils.overlap_dict import FUND_EXPENSE_RATIOS, DEFAULT_EXPENSE_RATIO, INDEX_EXPENSE_RATIO
from typing import Optional


# ── XIRR for a single fund ──────────────────────────────────────
def calculate_fund_xirr(
    transactions: list[Transaction],
    current_value: float,
    current_date: Optional[date] = None
) -> float:
    """
    Calculates XIRR for one fund using all its transactions + current value.

    Logic:
    - All purchases are negative cashflows (money going OUT of pocket)
    - All redemptions are positive cashflows (money coming IN)
    - Current value is treated as a final positive cashflow on today's date
    - pyxirr handles the irregular date math

    Returns XIRR as a percentage e.g. 14.5 means 14.5% annualized return.
    Returns 0.0 if calculation fails (not enough data).
    """
    if not transactions:
        return 0.0

    if current_date is None:
        current_date = date.today()

    # Build parallel lists — dates and cashflows
    dates = []
    amounts = []

    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn.date, "%Y-%m-%d").date()
        except ValueError:
            continue  # Skip malformed dates

        dates.append(txn_date)
        # Purchases are negative (cash out), redemptions are positive (cash in)
        amounts.append(-abs(txn.amount) if txn.amount > 0 else abs(txn.amount))

    # Current market value is the final inflow — as if you redeemed everything today
    dates.append(current_date)
    amounts.append(current_value)

    try:
        result = xirr(dates, amounts)
        if result is None:
            return 0.0
        # pyxirr returns a decimal e.g. 0.145 — convert to percentage
        return round(result * 100, 2)
    except Exception:
        # XIRR can fail if cashflows don't have a sign change or data is bad
        return 0.0


# ── XIRR across the entire portfolio ───────────────────────────
def calculate_portfolio_xirr(
    all_transactions: list[Transaction],
    total_current_value: float,
    current_date: Optional[date] = None
) -> float:
    """
    Calculates one XIRR number for the whole portfolio combined.
    Merges all transactions across all funds into one cashflow stream.

    This is the 'true overall return' number shown large on the dashboard.
    """
    if not all_transactions:
        return 0.0

    if current_date is None:
        current_date = date.today()

    dates = []
    amounts = []

    for txn in all_transactions:
        try:
            txn_date = datetime.strptime(txn.date, "%Y-%m-%d").date()
        except ValueError:
            continue

        dates.append(txn_date)
        amounts.append(-abs(txn.amount) if txn.amount > 0 else abs(txn.amount))

    # Total portfolio value as final inflow
    dates.append(current_date)
    amounts.append(total_current_value)

    try:
        result = xirr(dates, amounts)
        if result is None:
            return 0.0
        return round(result * 100, 2)
    except Exception:
        return 0.0


# ── Years held calculation ──────────────────────────────────────
def calculate_years_held(transactions: list[Transaction]) -> float:
    """
    Returns how many years the fund has been held.
    Calculated from the date of the first transaction to today.
    Used for expense ratio drag calculation.
    """
    if not transactions:
        return 0.0

    dates = []
    for txn in transactions:
        try:
            dates.append(datetime.strptime(txn.date, "%Y-%m-%d").date())
        except ValueError:
            continue

    if not dates:
        return 0.0

    first_date = min(dates)
    years = (date.today() - first_date).days / 365.25
    return round(years, 2)


# ── Expense ratio drag ──────────────────────────────────────────
def calculate_expense_drag(
    fund_name: str,
    corpus: float,
    years_held: float
) -> ExpenseRatioDrag:
    """
    Calculates how much money the investor has lost to excess fees
    compared to investing in a Nifty 50 index fund.

    Formula: drag = corpus × (fund_expense - index_expense) × years_held
    Simple linear approximation — good enough for the hackathon.
    Compound drag would be: corpus × ((1 + fund_er)^years - (1 + index_er)^years)
    """
    fund_er = FUND_EXPENSE_RATIOS.get(fund_name, DEFAULT_EXPENSE_RATIO) / 100
    index_er = INDEX_EXPENSE_RATIO / 100

    drag_amount = corpus * (fund_er - index_er) * years_held
    drag_amount = max(0.0, round(drag_amount, 2))  # Can't be negative

    return ExpenseRatioDrag(
        fund_name=fund_name,
        fund_expense_ratio=round(fund_er * 100, 2),
        index_expense_ratio=INDEX_EXPENSE_RATIO,
        corpus=corpus,
        years_held=years_held,
        drag_amount=drag_amount
    )


# ── Build FundHolding objects from transaction groups ───────────
def build_fund_holdings(
    grouped_transactions: dict[str, list[Transaction]],
    current_values: dict[str, float]
) -> list[FundHolding]:
    """
    Takes transactions grouped by fund name and current values per fund.
    Returns a list of FundHolding objects ready for the response.

    grouped_transactions: { "Parag Parikh Flexi Cap Fund": [txn1, txn2, ...] }
    current_values:       { "Parag Parikh Flexi Cap Fund": 125000.0 }
    """
    holdings = []

    for fund_name, transactions in grouped_transactions.items():
        current_value = current_values.get(fund_name, 0.0)
        total_invested = sum(txn.amount for txn in transactions if txn.amount > 0)
        total_units = sum(txn.units or 0 for txn in transactions)
        expense_ratio = FUND_EXPENSE_RATIOS.get(fund_name, DEFAULT_EXPENSE_RATIO)
        fund_xirr = calculate_fund_xirr(transactions, current_value)

        holdings.append(FundHolding(
            fund_name=fund_name,
            current_value=round(current_value, 2),
            total_invested=round(total_invested, 2),
            units_held=round(total_units, 3),
            expense_ratio=expense_ratio,
            xirr=fund_xirr,
        ))

    return holdings