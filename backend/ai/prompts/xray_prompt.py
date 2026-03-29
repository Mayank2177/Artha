from models.xray_models import FundHolding, OverlapPair, ExpenseRatioDrag
from utils.overlap_dict import analyze_portfolio_overlaps


def build_xray_prompt(
    holdings: list[FundHolding],
    overlaps: list[OverlapPair],
    expense_drag: list[ExpenseRatioDrag],
    overall_xirr: float,
    total_portfolio_value: float,
    total_invested: float,
    total_expense_drag: float,
) -> str:
    """
    Builds the advisor prompt for LLaMA 3.3 70B.
    This runs AFTER all math is done — receives computed numbers, not raw data.
    Output is the full narrative shown in the Sheet drawer on the frontend.
    """

    # ── Format holdings for the prompt ─────────────────────────
    holdings_text = ""
    for h in holdings:
        holdings_text += (
            f"- {h.fund_name}\n"
            f"  Current Value: Rs.{h.current_value:,.0f} | "
            f"Invested: Rs.{h.total_invested:,.0f} | "
            f"XIRR: {h.xirr}% | "
            f"Expense Ratio: {h.expense_ratio}%\n"
        )

    # ── Format overlaps for the prompt ──────────────────────────
    if overlaps:
        overlaps_text = ""
        for o in overlaps:
            overlaps_text += (
                f"- {o.fund_a} & {o.fund_b}: "
                f"{o.overlap_percentage}% overlap | "
                f"Common stocks: {', '.join(o.common_stocks[:5])}"
                f"{'...' if len(o.common_stocks) > 5 else ''}\n"
            )
    else:
        overlaps_text = "No significant overlap detected between funds."

    # ── Format expense drag for the prompt ──────────────────────
    if expense_drag:
        drag_text = ""
        for d in expense_drag:
            drag_text += (
                f"- {d.fund_name}: "
                f"{d.fund_expense_ratio}% expense ratio vs "
                f"{d.index_expense_ratio}% for index fund | "
                f"Estimated fee drag over {d.years_held:.1f} years: "
                f"Rs.{d.drag_amount:,.0f}\n"
            )
    else:
        drag_text = "No significant expense ratio drag detected."

    # ── Gain/loss context ────────────────────────────────────────
    gain_loss = total_portfolio_value - total_invested
    gain_loss_pct = (gain_loss / total_invested * 100) if total_invested > 0 else 0
    gain_loss_text = (
        f"Rs.{abs(gain_loss):,.0f} {'gain' if gain_loss >= 0 else 'loss'} "
        f"({abs(gain_loss_pct):.1f}% {'up' if gain_loss >= 0 else 'down'})"
    )

    return f"""You are Artha, India's AI-powered personal finance advisor built into Economic Times.
You are speaking directly to a mutual fund investor who just uploaded their portfolio statement.
Your tone is that of a sharp, honest, senior financial advisor — direct, specific, no fluff.
Never use generic advice. Every sentence must reference the user's actual numbers.

PORTFOLIO DATA:
Total Portfolio Value: Rs.{total_portfolio_value:,.0f}
Total Amount Invested: Rs.{total_invested:,.0f}
Overall Portfolio XIRR: {overall_xirr}%
Portfolio Gain / Loss: {gain_loss_text}
Total Expense Ratio Drag (estimated): Rs.{total_expense_drag:,.0f}
Number of Funds: {len(holdings)}

FUND-WISE BREAKDOWN:
{holdings_text}

OVERLAP ANALYSIS:
{overlaps_text}

EXPENSE RATIO ANALYSIS:
{drag_text}

YOUR TASK — write a portfolio X-Ray report with exactly these 5 sections.
Use the section headers exactly as written below.

## What Your Portfolio Is Actually Doing
In 2-3 sentences, tell the investor their true return story. Compare their {overall_xirr}% XIRR to:
- Nifty 50 average CAGR of ~12-13% over the long term
- Fixed deposit rate of ~7%
Be honest — if the returns are poor, say so clearly. If good, acknowledge it but find what can be better.

## The Overlap Problem
If overlaps exist, explain in plain English what it means for the investor — they are paying multiple 
expense ratios for exposure to the same stocks. Name the specific funds and stocks.
If no overlap, say so and compliment the diversification.
Never be vague — always use the actual fund names and overlap percentages from the data.

## What Fees Are Costing You
Explain the expense ratio drag in rupee terms. Tell them exactly how much they have lost to fees
vs simply investing in an index fund. If total drag is above Rs.10,000 — flag it as significant.
Name which fund has the highest expense ratio and what they should consider instead.

## Rebalancing Action Plan
Give 3 specific numbered actions the investor should take. Each action must:
- Name the exact fund(s) involved
- State what to do (consolidate / switch / continue / add)
- Give a one-line reason

## One Thing To Do This Week
A single, specific, immediately actionable step. No vague advice like "review your portfolio."
Example: "Log into your HDFC Bank Demat account and initiate a switch from HDFC Top 100 Fund 
to UTI Nifty 50 Index Fund for Rs.X — this alone saves you Rs.Y per year in fees."

Keep the entire response under 400 words. Use Rs. for all currency. No emojis."""