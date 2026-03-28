"""
Prompt builder for Tax Wizard feature.
Builds two prompts:
1. PDF extraction prompt → LLaMA 3.1 8B (structured JSON)
2. Advice prompt → LLaMA 3.3 70B (natural language advice)
"""
from models.tax_models import (
    ManualTaxInput,
    TaxBreakdown,
    MissedDeduction,
)


# ─── PDF EXTRACTION PROMPT ────────────────────────────────────────────────────

def build_pdf_extraction_prompt(raw_pdf_text: str) -> str:
    """
    Builds prompt for LLaMA 3.1 8B to extract structured salary data
    from raw Form 16 PDF text.

    Returns a prompt that instructs the model to return JSON only.
    """
    return f"""
You are a data extraction assistant. Extract salary and tax information from the following Form 16 text.

Return ONLY a valid JSON object with these exact keys. Use null for any field you cannot find.
Do not include any explanation, markdown, or text outside the JSON.

Required JSON structure:
{{
    "annual_ctc": <float or null>,
    "basic_salary": <float or null>,
    "hra_received": <float or null>,
    "da": <float or null>,
    "special_allowance": <float or null>,
    "section_80c": <float or null>,
    "section_80d": <float or null>,
    "section_80ccd_1b": <float or null>,
    "home_loan_interest": <float or null>,
    "annual_rent_paid": <float or null>,
    "is_metro": <true/false or null>,
    "age": <integer or null>
}}

FORM 16 TEXT:
{raw_pdf_text}

JSON:
""".strip()


# ─── ADVICE PROMPT ────────────────────────────────────────────────────────────

def build_tax_advice_prompt(
    data: ManualTaxInput,
    old_regime: TaxBreakdown,
    new_regime: TaxBreakdown,
    recommended_regime: str,
    tax_saving: float,
    missed_deductions: list[MissedDeduction],
    et_context: str = "",
) -> str:
    """
    Builds the full advice prompt for LLaMA 3.3 70B.
    Embeds all computed tax data + ET RSS context.

    Args:
        data: Original user input
        old_regime: Computed old regime breakdown
        new_regime: Computed new regime breakdown
        recommended_regime: "old" or "new"
        tax_saving: Rupee amount saved by choosing recommended regime
        missed_deductions: List of unutilized deductions
        et_context: Live ET RSS context block (empty string if unavailable)

    Returns:
        Complete prompt string ready to send to Groq
    """

    # Format missed deductions for the prompt
    if missed_deductions:
        missed_str = "\n".join([
            f"- {d.section} ({d.description}): "
            f"Utilized ₹{d.utilized:,.0f} of ₹{d.max_limit:,.0f} limit. "
            f"Remaining ₹{d.remaining:,.0f} → potential saving ₹{d.potential_tax_saving:,.0f}"
            for d in missed_deductions
            if d.max_limit > 0  # skip HRA warning row
        ])
        hra_warning = next(
            (d for d in missed_deductions if d.section == "HRA"),
            None
        )
    else:
        missed_str   = "None — user has utilized all major deductions."
        hra_warning  = None

    hra_note = (
        "\n⚠ User pays rent but has not declared HRA to employer. "
        "They may be missing HRA exemption."
        if hra_warning else ""
    )

    # Format ET context block
    et_block = f"""
TODAY'S ECONOMIC TIMES MARKET CONTEXT:
{et_context}
Use this to make your advice timely and grounded in current market conditions.
""".strip() if et_context else ""

    prompt = f"""
You are Artha, India's most trusted AI financial advisor.
You speak like a knowledgeable friend — clear, specific, and empathetic.
Never use jargon without explaining it. Always give rupee amounts, not just percentages.

─── USER PROFILE ───────────────────────────────────────────
Annual CTC          : ₹{data.annual_ctc:,.0f}
Age                 : {data.age} years
Financial Year      : {data.financial_year}
City Type           : {"Metro" if data.is_metro else "Non-Metro"}

─── OLD REGIME RESULT ──────────────────────────────────────
Gross Income        : ₹{old_regime.gross_income:,.0f}
Total Deductions    : ₹{old_regime.total_deductions:,.0f}
Taxable Income      : ₹{old_regime.taxable_income:,.0f}
Total Tax (with cess): ₹{old_regime.total_tax:,.0f}
Monthly In-Hand     : ₹{old_regime.in_hand_monthly:,.0f}
Effective Tax Rate  : {old_regime.effective_tax_rate}%

─── NEW REGIME RESULT ──────────────────────────────────────
Gross Income        : ₹{new_regime.gross_income:,.0f}
Total Deductions    : ₹{new_regime.total_deductions:,.0f}
Taxable Income      : ₹{new_regime.taxable_income:,.0f}
Total Tax (with cess): ₹{new_regime.total_tax:,.0f}
Monthly In-Hand     : ₹{new_regime.in_hand_monthly:,.0f}
Effective Tax Rate  : {new_regime.effective_tax_rate}%

─── RECOMMENDATION ─────────────────────────────────────────
Better Regime       : {recommended_regime.upper()} REGIME
Tax Saving          : ₹{tax_saving:,.0f} per year

─── MISSED DEDUCTIONS ──────────────────────────────────────
{missed_str}
{hra_note}

{et_block}

─── YOUR TASK ──────────────────────────────────────────────
Write a personalized tax advice response with these four sections:

1. REGIME RECOMMENDATION (2-3 lines)
   Tell the user clearly which regime to pick and exactly why in rupee terms.
   Example: "Choose the Old Regime — it saves you ₹18,400 this year because your 80C and HRA deductions bring your taxable income down significantly."

2. TOP 3 ACTIONS BEFORE MARCH 31 (bullet points)
   Specific investments or steps the user can take right now to reduce tax.
   Each action must mention the section, the amount to invest, and the exact rupee saving.
   Prioritize the highest-impact missed deductions first.

3. WHAT THIS MEANS FOR YOUR MONTHLY SALARY (1-2 lines)
   Tell them their monthly in-hand amount under the recommended regime.
   If they switch regime, tell them how much more or less they will take home monthly.

4. ONE THING TO DO THIS WEEK (1 line)
   The single most impactful action they can take immediately.
   Be very specific — name the exact instrument (e.g. "Open an NPS Tier 1 account on NSDL CRA website").

Keep the tone warm, direct, and encouraging.
Do not repeat the numbers from the data dump above — synthesize them into natural advice.
""".strip()

    return prompt