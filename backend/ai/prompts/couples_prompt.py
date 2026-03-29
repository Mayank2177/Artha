"""
Prompt builder for Couple's Money Planner feature.
Builds advice prompt for LLaMA 3.3 70B with both partner profiles
and all computed optimization opportunities.
"""
from models.couples_models import (
    CouplesInput,
    HRAOptimization,
    InvestmentRouting,
    InsuranceAnalysis,
    NetWorthSummary,
)


def build_couples_advice_prompt(
    data: CouplesInput,
    hra: HRAOptimization,
    investments: InvestmentRouting,
    insurance: InsuranceAnalysis,
    net_worth: NetWorthSummary,
    combined_annual_income: float,
    combined_monthly_income: float,
) -> str:
    """
    Builds the full advice prompt for LLaMA 3.3 70B.
    Embeds all computed optimization data for both partners.

    Returns:
        Complete prompt string ready to send to Groq
    """

    partner_a = data.partner_a
    partner_b = data.partner_b

    # ── Insurance gap section ──
    insurance_notes = []
    if not insurance.partner_a_adequate:
        insurance_notes.append(
            f"- {partner_a.name} is underinsured by ₹{insurance.partner_a_gap:,.0f}. "
            f"Needs ₹{insurance.partner_a_required_cover:,.0f} in term cover."
        )
    else:
        insurance_notes.append(
            f"- {partner_a.name} has adequate life insurance cover. ✓"
        )

    if not insurance.partner_b_adequate:
        insurance_notes.append(
            f"- {partner_b.name} is underinsured by ₹{insurance.partner_b_gap:,.0f}. "
            f"Needs ₹{insurance.partner_b_required_cover:,.0f} in term cover."
        )
    else:
        insurance_notes.append(
            f"- {partner_b.name} has adequate life insurance cover. ✓"
        )

    if not insurance.combined_health_adequate:
        insurance_notes.append(
            "- Combined health insurance is below the recommended ₹10,00,000. "
            "Consider a family floater plan."
        )
    else:
        insurance_notes.append(
            "- Combined health insurance coverage is adequate. ✓"
        )

    insurance_block = "\n".join(insurance_notes)

    # ── Investment routing section ──
    higher_name = (
        partner_a.name
        if investments.higher_bracket_partner == "partner_a"
        else partner_b.name
    )

    prompt = f"""
You are Artha, India's most trusted AI financial advisor for couples.
You speak like a knowledgeable friend — warm, specific, and empathetic.
Always use both partners' names. Always give rupee amounts.
Never use jargon without explaining it.

─── PARTNER PROFILES ───────────────────────────────────────────────
{partner_a.name}
  Annual Income     : ₹{partner_a.annual_income:,.0f}
  Tax Bracket       : {int(partner_a.tax_bracket * 100)}%
  80C Invested      : ₹{partner_a.section_80c_invested:,.0f} of ₹1,50,000
  NPS Invested      : ₹{partner_a.nps_invested:,.0f} of ₹50,000
  Life Cover        : ₹{partner_a.existing_life_cover:,.0f}
  Health Cover      : ₹{partner_a.existing_health_cover:,.0f}
  Net Worth         : ₹{net_worth.partner_a_net_worth:,.0f}

{partner_b.name}
  Annual Income     : ₹{partner_b.annual_income:,.0f}
  Tax Bracket       : {int(partner_b.tax_bracket * 100)}%
  80C Invested      : ₹{partner_b.section_80c_invested:,.0f} of ₹1,50,000
  NPS Invested      : ₹{partner_b.nps_invested:,.0f} of ₹50,000
  Life Cover        : ₹{partner_b.existing_life_cover:,.0f}
  Health Cover      : ₹{partner_b.existing_health_cover:,.0f}
  Net Worth         : ₹{net_worth.partner_b_net_worth:,.0f}

─── COMBINED PICTURE ───────────────────────────────────────────────
Combined Annual Income  : ₹{combined_annual_income:,.0f}
Combined Monthly Income : ₹{combined_monthly_income:,.0f}
Combined Assets         : ₹{net_worth.combined_assets:,.0f}
Combined Liabilities    : ₹{net_worth.combined_liabilities:,.0f}
Combined Net Worth      : ₹{net_worth.combined_net_worth:,.0f}

─── HRA OPTIMIZATION ───────────────────────────────────────────────
Recommended Claimant    : {partner_a.name if hra.recommended_claimant == "partner_a" else partner_b.name}
{partner_a.name} HRA Exemption : ₹{hra.partner_a_exemption:,.0f}
{partner_b.name} HRA Exemption : ₹{hra.partner_b_exemption:,.0f}
Better Exemption        : ₹{hra.better_exemption:,.0f}
Annual Tax Saving       : ₹{hra.annual_tax_saving:,.0f}
Reason                  : {hra.reason}

─── INVESTMENT ROUTING ─────────────────────────────────────────────
Higher Tax Bracket      : {higher_name}
80C Remaining — {partner_a.name}  : ₹{investments.recommended_80c_split["partner_a"]:,.0f}
80C Remaining — {partner_b.name}  : ₹{investments.recommended_80c_split["partner_b"]:,.0f}
NPS Remaining — {partner_a.name}  : ₹{investments.recommended_nps_split["partner_a"]:,.0f}
NPS Remaining — {partner_b.name}  : ₹{investments.recommended_nps_split["partner_b"]:,.0f}
Total 80C Remaining     : ₹{investments.total_80c_remaining:,.0f}
Total NPS Remaining     : ₹{investments.total_nps_remaining:,.0f}
Annual Tax Saving       : ₹{investments.annual_tax_saving:,.0f}

─── INSURANCE ANALYSIS ─────────────────────────────────────────────
{insurance_block}

─── YOUR TASK ──────────────────────────────────────────────────────
Write a personalized joint financial strategy with these four sections:

1. HRA STRATEGY (2-3 lines)
   Tell them clearly who should claim HRA and exactly why in rupee terms.
   Be specific — name the partner, name the saving amount.

2. INVESTMENT PLAN (bullet points)
   How should they route their remaining 80C and NPS investments?
   Mention which partner should invest how much and in which instrument.
   Prioritize the higher tax bracket partner for maximum savings.
   Give the exact rupee saving from following this plan.

3. INSURANCE ACTION PLAN (bullet points)
   Address any gaps in life or health cover.
   If a partner is underinsured, name the exact cover amount needed
   and suggest term insurance as the most cost-effective option.
   If everything is adequate, acknowledge it and suggest a review timeline.

4. COMBINED NET WORTH SNAPSHOT (2-3 lines)
   Summarize their financial position as a couple.
   Give one specific suggestion to grow their combined net worth
   over the next 12 months — be concrete, name an instrument or action.

Keep the tone warm, encouraging, and couple-friendly.
Refer to them as a team. Avoid making either partner feel blamed
for gaps — frame everything as opportunities to optimize together.
""".strip()

    return prompt