"""
Prompt builder for FIRE Path Planner feature.
Builds advice prompt for LLaMA 3.3 70B with all computed
financial data + ET RSS market context.
"""
from models.fire_models import (
    FireInput,
    GoalPlan,
    AssetAllocation,
)


def build_fire_advice_prompt(
    data: FireInput,
    goal_plans: list[GoalPlan],
    total_monthly_sip_required: float,
    existing_sip: float,
    additional_sip_needed: float,
    emergency_fund_target: float,
    emergency_fund_gap: float,
    insurance_gap: float,
    asset_allocation: AssetAllocation,
    years_to_retirement: int,
    retirement_corpus_needed: float,
    monthly_income: float,
    monthly_expenses: float,
    monthly_surplus: float,
    savings_rate_percent: float,
    et_context: str = "",
) -> str:
    """
    Builds the full advice prompt for LLaMA 3.3 70B.
    Embeds all computed FIRE data + live ET market context.

    Returns:
        Complete prompt string ready to send to Groq
    """

    # ── Format goal plans ──
    goals_block = ""
    for i, goal in enumerate(goal_plans, 1):
        achievability = "✓ Achievable" if goal.is_achievable else "⚠ Needs attention"
        goals_block += f"""
  Goal {i}: {goal.name} (Priority {goal.priority})
    Target Amount          : ₹{goal.target_amount:,.0f}
    Years Remaining        : {goal.years_to_goal} years
    Inflation Adjusted     : ₹{goal.inflation_adjusted_corpus:,.0f}
    Current Gap            : ₹{goal.current_gap:,.0f}
    Monthly SIP Required   : ₹{goal.sip_required:,.0f}
    Status                 : {achievability}
"""

    # ── Format risk flags ──
    risk_flags = []
    unachievable_goals = [g for g in goal_plans if not g.is_achievable]
    if unachievable_goals:
        for g in unachievable_goals:
            risk_flags.append(
                f"- {g.name} requires ₹{g.sip_required:,.0f}/month SIP "
                f"which exceeds 30% of monthly income — needs prioritization."
            )

    if emergency_fund_gap > 0:
        risk_flags.append(
            f"- Emergency fund gap of ₹{emergency_fund_gap:,.0f} — "
            f"build this before aggressive investing."
        )

    if insurance_gap > 0:
        risk_flags.append(
            f"- Life insurance gap of ₹{insurance_gap:,.0f} — "
            f"get term insurance immediately."
        )

    if monthly_surplus < total_monthly_sip_required:
        risk_flags.append(
            f"- Monthly surplus ₹{monthly_surplus:,.0f} is less than "
            f"total SIP required ₹{total_monthly_sip_required:,.0f} — "
            f"income increase or expense reduction needed."
        )

    risk_block = (
        "\n".join(risk_flags)
        if risk_flags
        else "No major risk flags — financial position is healthy."
    )

    # ── ET context block ──
    et_block = f"""
TODAY'S ECONOMIC TIMES MARKET CONTEXT:
{et_context}
Use this to ground SIP recommendations and corpus projections
in current market conditions — RBI rate, inflation, Nifty P/E.
""".strip() if et_context else ""

    prompt = f"""
You are Artha, India's most trusted AI financial advisor.
You speak like a knowledgeable friend — clear, specific, empathetic.
Always give rupee amounts. Never use jargon without explaining it.
Frame everything as a journey, not a lecture.

─── USER PROFILE ───────────────────────────────────────────────────
Age                     : {data.age} years
Retirement Target Age   : {data.retirement_age} years
Years to Retirement     : {years_to_retirement} years
Annual Income           : ₹{data.annual_income:,.0f}
Annual Expenses         : ₹{data.annual_expenses:,.0f}
Monthly Income          : ₹{monthly_income:,.0f}
Monthly Expenses        : ₹{monthly_expenses:,.0f}
Monthly Surplus         : ₹{monthly_surplus:,.0f}
Savings Rate            : {savings_rate_percent}%
Existing Savings        : ₹{data.existing_savings:,.0f}
Existing Monthly SIP    : ₹{data.existing_sip:,.0f}
Existing Insurance Cover: ₹{data.existing_insurance_cover:,.0f}

─── GOAL PLANS ─────────────────────────────────────────────────────
{goals_block}

─── KEY NUMBERS ────────────────────────────────────────────────────
Total SIP Required      : ₹{total_monthly_sip_required:,.0f}/month
Existing SIP            : ₹{existing_sip:,.0f}/month
Additional SIP Needed   : ₹{additional_sip_needed:,.0f}/month
Emergency Fund Target   : ₹{emergency_fund_target:,.0f}
Emergency Fund Gap      : ₹{emergency_fund_gap:,.0f}
Insurance Gap           : ₹{insurance_gap:,.0f}
Retirement Corpus Needed: ₹{retirement_corpus_needed:,.0f}

─── ASSET ALLOCATION ───────────────────────────────────────────────
Equity                  : {asset_allocation.equity_percent}% → ₹{asset_allocation.equity_amount_monthly:,.0f}/month
Debt                    : {asset_allocation.debt_percent}% → ₹{asset_allocation.debt_amount_monthly:,.0f}/month

─── RISK FLAGS ─────────────────────────────────────────────────────
{risk_block}

{et_block}

─── YOUR TASK ──────────────────────────────────────────────────────
Write a personalized FIRE roadmap with these five sections:

1. FIRST 6 MONTHS — FOUNDATION (2-3 lines)
   What should they do immediately?
   Address emergency fund and insurance gaps first if they exist.
   Give specific rupee amounts and actions.

2. GOAL PRIORITY ORDER (bullet points)
   Which goal should they focus on first and why?
   For each unachievable goal, suggest how to bridge the gap —
   increase income, reduce expenses, or extend timeline.
   Name specific instruments: ELSS, PPF, NPS, index funds.

3. SIP BREAKDOWN (bullet points)
   How should they split the ₹{total_monthly_sip_required:,.0f} monthly SIP?
   Map each goal to a specific fund category.
   Mention the equity/debt split based on their age.

4. THE 1-YEAR MILESTONE (2-3 lines)
   What should their financial position look like in 12 months?
   Give a specific net worth or savings target to aim for.

5. ONE THING TO DO THIS WEEK (1 line)
   The single most impactful action they can take right now.
   Be very specific — name the exact platform or instrument.

Keep the tone optimistic and motivating.
Acknowledge their existing efforts before pointing out gaps.
Make the FIRE dream feel achievable, not overwhelming.
""".strip()

    return prompt