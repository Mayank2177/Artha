import sys
import io

# Fix Windows encoding issues
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from datetime import datetime
from models.xray_models import Transaction, FundHolding
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

print("\n" + "=" * 70)
print("MF PORTFOLIO X-RAY ANALYSIS DEMO")
print("=" * 70)

# Real investor portfolio data (dummy but realistic)
demo_transactions = [
    # Fund 1: Mirae Asset Large Cap Fund (12-month SIP)
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-01-15", amount=5000, units=123.5, nav=40.50),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-02-15", amount=5000, units=119.0, nav=42.00),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-03-15", amount=5000, units=125.1, nav=39.97),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-04-15", amount=5000, units=120.2, nav=41.59),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-05-15", amount=5000, units=122.5, nav=40.82),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-06-15", amount=5000, units=117.3, nav=42.62),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-07-15", amount=5000, units=124.0, nav=40.32),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-08-15", amount=5000, units=118.5, nav=42.14),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-09-15", amount=5000, units=120.0, nav=41.67),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-10-15", amount=5000, units=125.8, nav=39.74),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-11-15", amount=5000, units=119.3, nav=41.88),
    Transaction(fund_name="Mirae Asset Large Cap Fund", date="2023-12-15", amount=5000, units=117.9, nav=42.43),

    # Fund 2: HDFC Top 100 Fund (lumpsum + SIP)
    Transaction(fund_name="HDFC Top 100 Fund", date="2022-06-10", amount=100000, units=1250, nav=80.00),
    Transaction(fund_name="HDFC Top 100 Fund", date="2023-06-10", amount=10000, units=105.2, nav=95.00),
    Transaction(fund_name="HDFC Top 100 Fund", date="2024-01-10", amount=10000, units=98.5, nav=101.50),

    # Fund 3: Parag Parikh Flexi Cap Fund (lumpsum + recent SIP)
    Transaction(fund_name="Parag Parikh Flexi Cap Fund", date="2021-12-01", amount=200000, units=3333.3, nav=60.00),
    Transaction(fund_name="Parag Parikh Flexi Cap Fund", date="2023-12-01", amount=50000, units=609.1, nav=82.00),
    Transaction(fund_name="Parag Parikh Flexi Cap Fund", date="2024-01-01", amount=10000, units=117.1, nav=85.40),
]

# Current market values as of today
demo_current_values = {
    "Mirae Asset Large Cap Fund": 75000,
    "HDFC Top 100 Fund": 220000,
    "Parag Parikh Flexi Cap Fund": 455000,
}

# ─── PHASE 1: COLLECT ────────────────────────────────────────────────────────
print("\n[PHASE 1] COLLECT — Portfolio Overview")
print("-" * 70)

fund_transactions = {}
for txn in demo_transactions:
    if txn.fund_name not in fund_transactions:
        fund_transactions[txn.fund_name] = []
    fund_transactions[txn.fund_name].append(txn)

total_invested = 0
for fund_name, txns in fund_transactions.items():
    fund_invested = sum(t.amount for t in txns if t.amount > 0)
    total_invested += fund_invested
    print(f"\n{fund_name}")
    print(f"  Transactions: {len(txns)}")
    print(f"  Total Invested: Rs {fund_invested:,.0f}")

print(f"\nPortfolio Assets:")
print(f"  Total Invested: Rs {total_invested:,.0f}")
print(f"  Current Value: Rs {sum(demo_current_values.values()):,.0f}")
print(f"  Gain: Rs {sum(demo_current_values.values()) - total_invested:,.0f}")

# ─── PHASE 2: COMPUTE ────────────────────────────────────────────────────────
print("\n\n[PHASE 2] COMPUTE — Financial Analysis")
print("-" * 70)

# Build holdings with XIRR
holdings = build_fund_holdings(fund_transactions, demo_current_values)

total_current_value = sum(h.current_value for h in holdings)
overall_xirr = calculate_portfolio_xirr(demo_transactions, total_current_value)
gain_loss = total_current_value - total_invested
gain_loss_pct = (gain_loss / total_invested * 100) if total_invested > 0 else 0

print(f"\nFund-wise Analysis:")
for h in holdings:
    print(f"\n{h.fund_name}")
    print(f"  Current Value: Rs {h.current_value:,.0f}")
    print(f"  Total Invested: Rs {h.total_invested:,.0f}")
    print(f"  Gain/Loss: Rs {h.current_value - h.total_invested:,.0f}")
    print(f"  XIRR: {h.xirr:.2f}%")
    print(f"  Expense Ratio: {h.expense_ratio:.2f}%")

print(f"\nPortfolio Metrics:")
print(f"  Total Portfolio Value: Rs {total_current_value:,.0f}")
print(f"  Overall XIRR: {overall_xirr:.2f}%")
print(f"  Total Gain/Loss: Rs {gain_loss:,.0f}")
print(f"  Return %: {gain_loss_pct:.2f}%")

# Overlap analysis
overlaps = analyze_portfolio_overlaps([h.fund_name for h in holdings])

print(f"\nOverlap Analysis:")
if overlaps:
    for overlap in overlaps:
        severity = "HIGH" if overlap["overlap_percentage"] > 60 else "MEDIUM" if overlap["overlap_percentage"] > 40 else "LOW"
        print(f"\n  {overlap['fund_a']} <-> {overlap['fund_b']}")
        print(f"    Overlap: {overlap['overlap_percentage']:.1f}% ({severity})")
        print(f"    Common Holdings: {len(overlap['common_stocks'])} stocks")
else:
    print("  No significant overlaps detected")

# Expense drag analysis
print(f"\nExpense Drag Analysis:")
total_expense_drag = 0
for h in holdings:
    years = calculate_years_held(fund_transactions[h.fund_name])
    drag = calculate_expense_drag(h.fund_name, h.current_value, years)
    total_expense_drag += drag.drag_amount
    print(f"\n  {h.fund_name}")
    print(f"    Years Held: {years:.1f}")
    print(f"    Drag Amount: Rs {drag.drag_amount:,.0f}")

print(f"\n  TOTAL EXPENSE DRAG: Rs {total_expense_drag:,.0f}")

# ─── PHASE 3: ADVISE ─────────────────────────────────────────────────────────
print("\n\n[PHASE 3] ADVISE — AI-Generated Recommendation")
print("-" * 70)
print("\nCalling Groq API for personalized portfolio advice...\n")

try:
    # Convert overlaps to dict format for prompt
    overlap_dicts = [
        {
            "fund_a": o["fund_a"],
            "fund_b": o["fund_b"],
            "overlap_percentage": o["overlap_percentage"],
            "common_stocks": o["common_stocks"]
        } for o in overlaps
    ]

    # Build prompt with all computed data
    prompt = build_xray_prompt(
        holdings=holdings,
        total_portfolio_value=total_current_value,
        total_invested=total_invested,
        overall_xirr=overall_xirr,
        gain_loss_percentage=gain_loss_pct,
        overlaps=overlap_dicts,
        total_expense_drag=total_expense_drag,
    )

    # Get AI advice
    ai_advice = groq_manager.chat(prompt, max_tokens=1200)

    print("PORTFOLIO ADVISOR RECOMMENDATION:")
    print("=" * 70)
    print(ai_advice)
    print("=" * 70)

except Exception as e:
    print(f"[Error] Could not generate AI advice: {str(e)}")

# ─── SUMMARY ──────────────────────────────────────────────────────────────────
print("\n\n[SUMMARY]")
print("-" * 70)
print(f"Analysis Date: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}")
print(f"Funds Analyzed: {len(holdings)}")
print(f"Portfolio Value: Rs {total_current_value:,.0f}")
print(f"Total Return: {gain_loss_pct:.2f}% ({overall_xirr:.2f}% XIRR)")
print(f"High Overlap Warning: {'YES' if any(o['overlap_percentage'] > 60 for o in overlaps) else 'NO'}")
print(f"Annual Expense Drag: Rs {total_expense_drag:,.0f}")

print("\n" + "=" * 70)
print("Analysis Complete!")
print("=" * 70 + "\n")
