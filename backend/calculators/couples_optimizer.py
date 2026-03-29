"""
Couples Money Planner calculation engine.
Optimizes HRA, 80C routing, insurance, and net worth across two partners.
Pure Python — no AI, no API calls.
"""
from models.couples_models import (
    PartnerProfile,
    CouplesInput,
    HRAOptimization,
    InvestmentRouting,
    InsuranceAnalysis,
    NetWorthSummary,
)

# ─── CONSTANTS ────────────────────────────────────────────────────────────────

LIMIT_80C             = 150000   # Rs. 1.5L per person
LIMIT_NPS             = 50000    # Rs. 50K per person
REQUIRED_LIFE_COVER_MULTIPLIER = 10   # 10x annual income
RECOMMENDED_HEALTH_COVER       = 1000000  # Rs. 10L combined
CESS_RATE             = 0.04


# ─── HRA EXEMPTION ────────────────────────────────────────────────────────────

def _calculate_hra_exemption(partner: PartnerProfile) -> float:
    """
    Calculates HRA exemption for a single partner.
    Returns 0 if partner is not paying rent or not receiving HRA.
    """
    if partner.annual_rent_paid <= 0 or partner.hra_received <= 0:
        return 0.0

    basic        = partner.basic_salary
    metro_pct    = 0.50 if partner.is_metro else 0.40

    rule_1 = partner.hra_received
    rule_2 = metro_pct * basic
    rule_3 = max(0, partner.annual_rent_paid - 0.10 * basic)

    return min(rule_1, rule_2, rule_3)


def optimize_hra(
    partner_a: PartnerProfile,
    partner_b: PartnerProfile,
) -> HRAOptimization:
    """
    Calculates HRA exemption for both partners.
    Recommends whichever partner gets higher exemption to claim HRA.
    Tax saving = exemption × marginal rate × (1 + cess).
    """
    exemption_a = _calculate_hra_exemption(partner_a)
    exemption_b = _calculate_hra_exemption(partner_b)

    if exemption_a >= exemption_b:
        recommended        = "partner_a"
        better_exemption   = exemption_a
        marginal_rate      = partner_a.tax_bracket
        reason             = (
            f"{partner_a.name} gets a higher HRA exemption of "
            f"₹{exemption_a:,.0f} vs ₹{exemption_b:,.0f} for {partner_b.name}."
        )
    else:
        recommended        = "partner_b"
        better_exemption   = exemption_b
        marginal_rate      = partner_b.tax_bracket
        reason             = (
            f"{partner_b.name} gets a higher HRA exemption of "
            f"₹{exemption_b:,.0f} vs ₹{exemption_a:,.0f} for {partner_a.name}."
        )

    tax_saving = round(better_exemption * marginal_rate * (1 + CESS_RATE), 2)

    return HRAOptimization(
        recommended_claimant = recommended,
        partner_a_exemption  = round(exemption_a, 2),
        partner_b_exemption  = round(exemption_b, 2),
        better_exemption     = round(better_exemption, 2),
        annual_tax_saving    = tax_saving,
        reason               = reason,
    )


# ─── 80C + NPS ROUTING ────────────────────────────────────────────────────────

def optimize_investments(
    partner_a: PartnerProfile,
    partner_b: PartnerProfile,
) -> InvestmentRouting:
    """
    Routes remaining 80C and NPS investments through the higher
    tax bracket partner first to maximize tax savings.

    If both have same bracket, splits evenly.
    """
    remaining_80c_a = max(0.0, LIMIT_80C - partner_a.section_80c_invested)
    remaining_80c_b = max(0.0, LIMIT_80C - partner_b.section_80c_invested)
    remaining_nps_a = max(0.0, LIMIT_NPS - partner_a.nps_invested)
    remaining_nps_b = max(0.0, LIMIT_NPS - partner_b.nps_invested)

    total_80c_remaining = remaining_80c_a + remaining_80c_b
    total_nps_remaining = remaining_nps_a + remaining_nps_b

    # Identify higher bracket partner
    if partner_a.tax_bracket >= partner_b.tax_bracket:
        higher_bracket = "partner_a"
        higher_rate    = partner_a.tax_bracket
        lower_rate     = partner_b.tax_bracket
    else:
        higher_bracket = "partner_b"
        higher_rate    = partner_b.tax_bracket
        lower_rate     = partner_a.tax_bracket

    # Tax saving = remaining investments × respective marginal rate × (1 + cess)
    tax_saving_80c = round(
        (remaining_80c_a * partner_a.tax_bracket +
         remaining_80c_b * partner_b.tax_bracket) * (1 + CESS_RATE),
        2
    )
    tax_saving_nps = round(
        (remaining_nps_a * partner_a.tax_bracket +
         remaining_nps_b * partner_b.tax_bracket) * (1 + CESS_RATE),
        2
    )
    total_tax_saving = round(tax_saving_80c + tax_saving_nps, 2)

    return InvestmentRouting(
        higher_bracket_partner = higher_bracket,
        recommended_80c_split  = {
            "partner_a": round(remaining_80c_a, 2),
            "partner_b": round(remaining_80c_b, 2),
        },
        recommended_nps_split  = {
            "partner_a": round(remaining_nps_a, 2),
            "partner_b": round(remaining_nps_b, 2),
        },
        total_80c_remaining    = round(total_80c_remaining, 2),
        total_nps_remaining    = round(total_nps_remaining, 2),
        annual_tax_saving      = total_tax_saving,
    )


# ─── INSURANCE ANALYSIS ───────────────────────────────────────────────────────

def analyze_insurance(
    partner_a: PartnerProfile,
    partner_b: PartnerProfile,
) -> InsuranceAnalysis:
    """
    Checks insurance adequacy for both partners independently.
    Life cover requirement = 10x annual income per partner.
    Combined health cover should be at least Rs. 10L.
    """
    required_a = partner_a.annual_income * REQUIRED_LIFE_COVER_MULTIPLIER
    required_b = partner_b.annual_income * REQUIRED_LIFE_COVER_MULTIPLIER

    gap_a = max(0.0, required_a - partner_a.existing_life_cover)
    gap_b = max(0.0, required_b - partner_b.existing_life_cover)

    combined_health = (
        partner_a.existing_health_cover +
        partner_b.existing_health_cover
    )

    return InsuranceAnalysis(
        partner_a_required_cover  = round(required_a, 2),
        partner_b_required_cover  = round(required_b, 2),
        partner_a_gap             = round(gap_a, 2),
        partner_b_gap             = round(gap_b, 2),
        partner_a_adequate        = gap_a <= 0,
        partner_b_adequate        = gap_b <= 0,
        combined_health_adequate  = combined_health >= RECOMMENDED_HEALTH_COVER,
    )


# ─── NET WORTH ────────────────────────────────────────────────────────────────

def calculate_net_worth(
    partner_a: PartnerProfile,
    partner_b: PartnerProfile,
) -> NetWorthSummary:
    """
    Calculates individual and combined net worth.
    Net worth = total assets - total liabilities.
    """
    nw_a = partner_a.assets - partner_a.liabilities
    nw_b = partner_b.assets - partner_b.liabilities

    return NetWorthSummary(
        partner_a_net_worth    = round(nw_a, 2),
        partner_b_net_worth    = round(nw_b, 2),
        combined_net_worth     = round(nw_a + nw_b, 2),
        combined_assets        = round(partner_a.assets + partner_b.assets, 2),
        combined_liabilities   = round(partner_a.liabilities + partner_b.liabilities, 2),
    )


# ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

def run_couples_optimization(data: CouplesInput) -> dict:
    """
    Main function called by the Couples Planner route.
    Runs all optimizations and returns results as a dict.
    """
    partner_a = data.partner_a
    partner_b = data.partner_b

    hra          = optimize_hra(partner_a, partner_b)
    investments  = optimize_investments(partner_a, partner_b)
    insurance    = analyze_insurance(partner_a, partner_b)
    net_worth    = calculate_net_worth(partner_a, partner_b)

    combined_annual  = partner_a.annual_income + partner_b.annual_income
    combined_monthly = round(combined_annual / 12, 2)

    return {
        "hra_optimization"     : hra,
        "investment_routing"   : investments,
        "insurance_analysis"   : insurance,
        "net_worth"            : net_worth,
        "combined_annual_income" : combined_annual,
        "combined_monthly_income": combined_monthly,
    }