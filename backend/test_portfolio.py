import sys
import io
from datetime import datetime, timedelta

# Fix Windows encoding issues with Unicode characters
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from models.xray_models import Transaction, FundHolding, XRayInput
from calculators.xirr_engine import (
    calculate_fund_xirr,
    calculate_portfolio_xirr,
    calculate_years_held,
    calculate_expense_drag,
    build_fund_holdings
)
from utils.overlap_dict import analyze_portfolio_overlaps, FUND_EXPENSE_RATIOS, DEFAULT_EXPENSE_RATIO, INDEX_EXPENSE_RATIO
from ai.prompts.xray_prompt import build_xray_prompt
from ai.groq_client import groq_manager

# Dummy portfolio data — 2 funds with transactions
dummy_transactions = [
    # Fund 1: Mirae Asset Large Cap Fund
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2021-01-15", amount=50000, units=1250, nav=40.0),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2022-06-20", amount=75000, units=1800, nav=41.67),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-12-10", amount=100000, units=2200, nav=45.45),

    # Fund 2: HDFC Flexi Cap Fund
    Transaction(fund_name="HDFC Flexi Cap Fund", date="2021-03-01", amount=100000, units=2500, nav=40.0),
    Transaction(fund_name="HDFC Flexi Cap Fund", date="2023-01-15", amount=150000, units=3200, nav=46.88),
]

# Current values as of today
dummy_current_values = {
    "Mirae Asset Large Cap Fund": 450000,
    "HDFC Flexi Cap Fund": 575000,
}

print("Testing MF Portfolio X-Ray Feature...")
print("=" * 50)

# Group transactions by fund
fund_transactions = {}
for txn in dummy_transactions:
    if txn.fund_name not in fund_transactions:
        fund_transactions[txn.fund_name] = []
    fund_transactions[txn.fund_name].append(txn)

# Calculate XIRR for each fund
print("\n[FUND] Analysis:")
fund_xirrs = {}
total_invested = 0
total_current_value = 0

for fund_name, transactions in fund_transactions.items():
    current_value = dummy_current_values[fund_name]
    xirr = calculate_fund_xirr(transactions, current_value)
    fund_xirrs[fund_name] = xirr

    total_amount_invested = sum(t.amount for t in transactions if t.amount > 0)
    total_invested += total_amount_invested
    total_current_value += current_value

    expense_ratio = FUND_EXPENSE_RATIOS.get(fund_name, DEFAULT_EXPENSE_RATIO)

    print(f"\n   {fund_name}")
    print(f"     Current Value    : Rs {current_value:,.0f}")
    print(f"     Total Invested   : Rs {total_amount_invested:,.0f}")
    print(f"     XIRR             : {xirr:.2f}%")
    print(f"     Expense Ratio    : {expense_ratio:.2f}%")
    print(f"     Gain/Loss        : Rs {current_value - total_amount_invested:,.0f}")

# Calculate portfolio-level XIRR
portfolio_xirr = calculate_portfolio_xirr(dummy_transactions, dummy_current_values)
gain_loss = total_current_value - total_invested
gain_loss_pct = (gain_loss / total_invested * 100) if total_invested > 0 else 0

print(f"\n[PORTFOLIO] Summary:")
print(f"   Total Current Value  : Rs {total_current_value:,.0f}")
print(f"   Total Invested       : Rs {total_invested:,.0f}")
print(f"   Portfolio XIRR       : {portfolio_xirr:.2f}%")
print(f"   Gain/Loss            : Rs {gain_loss:,.0f}")
print(f"   Return %             : {gain_loss_pct:.2f}%")

# Analyze overlaps
fund_names = list(fund_transactions.keys())
overlaps = analyze_portfolio_overlaps(fund_names)

print(f"\n[OVERLAP] Analysis:")
if overlaps:
    for overlap in overlaps:
        print(f"   {overlap['fund_a']} <-> {overlap['fund_b']}")
        print(f"     Overlap %        : {overlap['overlap_percentage']:.1f}%")
        print(f"     Common Stocks    : {len(overlap['common_stocks'])} stocks")
else:
    print("   No significant overlaps detected (>30%)")

# Analyze expense drag
print(f"\n[EXPENSE] Drag Analysis:")
total_expense_drag = 0
for i, (fund_name, current_val) in enumerate(dummy_current_values.items()):
    expense_ratio = FUND_EXPENSE_RATIOS.get(fund_name, DEFAULT_EXPENSE_RATIO)
    years = calculate_years_held(dummy_transactions, fund_name)
    drag = calculate_expense_drag(
        fund_name=fund_name,
        corpus=current_val,
        expense_ratio=expense_ratio,
        years_held=years,
        index_expense_ratio=INDEX_EXPENSE_RATIO
    )
    total_expense_drag += drag.get("drag_amount", 0)

    print(f"   {fund_name}")
    print(f"     Years Held       : {years:.1f}")
    print(f"     Expense Ratio    : {expense_ratio:.2f}%")
    print(f"     Drag Amount      : Rs {drag.get('drag_amount', 0):,.0f}")

print(f"\n   Total Expense Drag   : Rs {total_expense_drag:,.0f}")

# Generate AI advice using Groq
print(f"\n[AI] Generating Portfolio Advice...")
try:
    # Build holdings for the prompt
    holdings = []
    for fund_name, current_val in dummy_current_values.items():
        txns = fund_transactions[fund_name]
        total_inv = sum(t.amount for t in txns if t.amount > 0)
        holdings.append(FundHolding(
            fund_name=fund_name,
            current_value=current_val,
            total_invested=total_inv,
            units_held=sum(t.units for t in txns if t.units),
            expense_ratio=FUND_EXPENSE_RATIOS.get(fund_name, DEFAULT_EXPENSE_RATIO),
            xirr=fund_xirrs[fund_name]
        ))

    prompt = build_xray_prompt(
        holdings=holdings,
        total_portfolio_value=total_current_value,
        total_invested=total_invested,
        overall_xirr=portfolio_xirr,
        gain_loss_percentage=gain_loss_pct,
        overlaps=overlaps,
        total_expense_drag=total_expense_drag,
    )

    ai_advice = groq_manager.chat(prompt, max_tokens=1000)

    print(f"\n[ADVICE] Portfolio Recommendation:")
    print(ai_advice)

except Exception as e:
    print(f"   Error generating AI advice: {str(e)}")

print("\n" + "=" * 50)
print("[OK] Portfolio X-Ray test completed successfully!")
