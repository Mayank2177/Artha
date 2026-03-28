# Old vs new regime slabs (2024-25), all deduction heads
"""
Tax calculation engine for Tax Wizard.
Implements 2024-25 tax slabs for both old and new regime.
Pure Python — no AI, no API calls.
"""
from models.tax_models import (
    ManualTaxInput,
    TaxBreakdown,
    MissedDeduction,
)


# ─── TAX SLABS 2024-25 ────────────────────────────────────────────────────────

OLD_REGIME_SLABS = [
    (250000,  0.00),   # 0 - 2.5L → 0%
    (500000,  0.05),   # 2.5L - 5L → 5%
    (1000000, 0.20),   # 5L - 10L → 20%
    (float("inf"), 0.30),  # above 10L → 30%
]

NEW_REGIME_SLABS = [
    (300000,  0.00),   # 0 - 3L → 0%
    (600000,  0.05),   # 3L - 6L → 5%
    (900000,  0.10),   # 6L - 9L → 10%
    (1200000, 0.15),   # 9L - 12L → 15%
    (1500000, 0.20),   # 12L - 15L → 20%
    (float("inf"), 0.30),  # above 15L → 30%
]

CESS_RATE = 0.04  # 4% health and education cess

# Standard deductions
OLD_REGIME_STANDARD_DEDUCTION = 50000   # Rs. 50,000
NEW_REGIME_STANDARD_DEDUCTION = 75000   # Rs. 75,000 (Budget 2024)

# Deduction limits
LIMIT_80C        = 150000  # Rs. 1.5L
LIMIT_80D_SELF   = 25000   # Rs. 25K
LIMIT_80D_PARENT = 50000   # Rs. 50K
LIMIT_80CCD_1B   = 50000   # Rs. 50K NPS additional
LIMIT_HOME_LOAN  = 200000  # Rs. 2L


# ─── HRA CALCULATION ──────────────────────────────────────────────────────────

def calculate_hra_exemption(
    basic_salary: float,
    da: float,
    hra_received: float,
    annual_rent_paid: float,
    is_metro: bool
) -> float:
    """
    HRA exemption = minimum of:
    1. Actual HRA received
    2. 50% of (basic + DA) for metro / 40% for non-metro
    3. Actual rent paid - 10% of (basic + DA)

    Returns exemption amount (0 if not renting).
    """
    if annual_rent_paid <= 0 or hra_received <= 0:
        return 0.0

    basic_plus_da = basic_salary + da
    metro_pct     = 0.50 if is_metro else 0.40

    rule_1 = hra_received
    rule_2 = metro_pct * basic_plus_da
    rule_3 = max(0, annual_rent_paid - 0.10 * basic_plus_da)

    return min(rule_1, rule_2, rule_3)


# ─── SLAB TAX CALCULATION ─────────────────────────────────────────────────────

def calculate_slab_tax(taxable_income: float, slabs: list) -> float:
    """
    Calculates tax based on slab rates.
    Iterates through slabs and applies rate to income in each bracket.
    """
    tax        = 0.0
    prev_limit = 0.0

    for limit, rate in slabs:
        if taxable_income <= prev_limit:
            break

        taxable_in_slab = min(taxable_income, limit) - prev_limit
        tax            += taxable_in_slab * rate
        prev_limit      = limit

    return tax


# ─── REBATE 87A ───────────────────────────────────────────────────────────────

def apply_rebate_87a(tax: float, taxable_income: float, regime: str) -> float:
    """
    Section 87A rebate:
    - Old regime: full rebate if taxable income <= 5L (max rebate Rs. 12,500)
    - New regime: full rebate if taxable income <= 7L (max rebate Rs. 25,000)
    """
    if regime == "old" and taxable_income <= 500000:
        return max(0.0, tax - 12500)

    if regime == "new" and taxable_income <= 700000:
        return max(0.0, tax - 25000)

    return tax


# ─── OLD REGIME ───────────────────────────────────────────────────────────────

def calculate_old_regime(data: ManualTaxInput) -> TaxBreakdown:
    """
    Calculates tax under old regime with all applicable deductions.
    """
    gross_income = data.annual_ctc

    # HRA exemption
    hra_exemption = calculate_hra_exemption(
        basic_salary     = data.basic_salary,
        da               = data.da,
        hra_received     = data.hra_received,
        annual_rent_paid = data.annual_rent_paid,
        is_metro         = data.is_metro,
    )

    # All deductions
    deductions = (
        OLD_REGIME_STANDARD_DEDUCTION
        + min(data.section_80c,        LIMIT_80C)
        + min(data.section_80d,        LIMIT_80D_SELF)
        + min(data.section_80d_parents, LIMIT_80D_PARENT)
        + min(data.section_80ccd_1b,   LIMIT_80CCD_1B)
        + min(data.home_loan_interest,  LIMIT_HOME_LOAN)
        + hra_exemption
        + data.other_deductions
    )

    taxable_income = max(0.0, gross_income - deductions)
    tax_before_rebate = calculate_slab_tax(taxable_income, OLD_REGIME_SLABS)
    tax_after_rebate  = apply_rebate_87a(tax_before_rebate, taxable_income, "old")
    cess              = round(tax_after_rebate * CESS_RATE, 2)
    total_tax         = round(tax_after_rebate + cess, 2)
    in_hand_monthly   = round((gross_income - total_tax) / 12, 2)
    effective_rate    = round((total_tax / gross_income) * 100, 2) if gross_income > 0 else 0.0

    return TaxBreakdown(
        gross_income      = gross_income,
        total_deductions  = round(deductions, 2),
        taxable_income    = round(taxable_income, 2),
        tax_before_cess   = round(tax_after_rebate, 2),
        cess              = cess,
        total_tax         = total_tax,
        in_hand_monthly   = in_hand_monthly,
        effective_tax_rate= effective_rate,
    )


# ─── NEW REGIME ───────────────────────────────────────────────────────────────

def calculate_new_regime(data: ManualTaxInput) -> TaxBreakdown:
    """
    Calculates tax under new regime.
    Only standard deduction of Rs. 75,000 applies — no other deductions.
    """
    gross_income   = data.annual_ctc
    deductions     = NEW_REGIME_STANDARD_DEDUCTION
    taxable_income = max(0.0, gross_income - deductions)

    tax_before_rebate = calculate_slab_tax(taxable_income, NEW_REGIME_SLABS)
    tax_after_rebate  = apply_rebate_87a(tax_before_rebate, taxable_income, "new")
    cess              = round(tax_after_rebate * CESS_RATE, 2)
    total_tax         = round(tax_after_rebate + cess, 2)
    in_hand_monthly   = round((gross_income - total_tax) / 12, 2)
    effective_rate    = round((total_tax / gross_income) * 100, 2) if gross_income > 0 else 0.0

    return TaxBreakdown(
        gross_income      = gross_income,
        total_deductions  = round(deductions, 2),
        taxable_income    = round(taxable_income, 2),
        tax_before_cess   = round(tax_after_rebate, 2),
        cess              = cess,
        total_tax         = total_tax,
        in_hand_monthly   = in_hand_monthly,
        effective_tax_rate= effective_rate,
    )


# ─── MISSED DEDUCTIONS ────────────────────────────────────────────────────────

def find_missed_deductions(data: ManualTaxInput, old_regime: TaxBreakdown) -> list[MissedDeduction]:
    """
    Identifies deductions the user hasn't fully utilized.
    Calculates potential tax saving for each missed deduction
    based on their marginal tax rate.
    """
    missed = []

    # Estimate marginal tax rate from taxable income
    taxable = old_regime.taxable_income
    if taxable <= 250000:
        marginal_rate = 0.00
    elif taxable <= 500000:
        marginal_rate = 0.05
    elif taxable <= 1000000:
        marginal_rate = 0.20
    else:
        marginal_rate = 0.30

    marginal_rate_with_cess = marginal_rate * (1 + CESS_RATE)

    def add_if_missed(section, description, limit, utilized):
        remaining = max(0.0, limit - utilized)
        if remaining > 0:
            missed.append(MissedDeduction(
                section            = section,
                description        = description,
                max_limit          = limit,
                utilized           = utilized,
                remaining          = remaining,
                potential_tax_saving = round(remaining * marginal_rate_with_cess, 2),
            ))

    add_if_missed("80C",        "ELSS, PPF, LIC, EPF, NSC",    LIMIT_80C,        data.section_80c)
    add_if_missed("80D",        "Health insurance for self/family", LIMIT_80D_SELF, data.section_80d)
    add_if_missed("80D Parents","Health insurance for parents",  LIMIT_80D_PARENT, data.section_80d_parents)
    add_if_missed("80CCD(1B)",  "NPS additional contribution",  LIMIT_80CCD_1B,   data.section_80ccd_1b)
    add_if_missed("24B",        "Home loan interest deduction",  LIMIT_HOME_LOAN,  data.home_loan_interest)

    # HRA — check if user is paying rent but not claiming
    if data.annual_rent_paid > 0 and data.hra_received <= 0:
        missed.append(MissedDeduction(
            section             = "HRA",
            description         = "You pay rent but haven't declared HRA — check with your employer",
            max_limit           = 0,
            utilized            = 0,
            remaining           = 0,
            potential_tax_saving= 0,
        ))

    return missed


# ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

def run_tax_calculation(data: ManualTaxInput) -> dict:
    """
    Main function called by the Tax Wizard route.
    Runs both regimes, finds recommendation and missed deductions.

    Returns:
        Dict with old_regime, new_regime, recommendation, missed_deductions
    """
    old_regime = calculate_old_regime(data)
    new_regime = calculate_new_regime(data)

    # Recommend whichever saves more tax
    if old_regime.total_tax <= new_regime.total_tax:
        recommended         = "old"
        tax_saving          = round(new_regime.total_tax - old_regime.total_tax, 2)
    else:
        recommended         = "new"
        tax_saving          = round(old_regime.total_tax - new_regime.total_tax, 2)

    missed_deductions = find_missed_deductions(data, old_regime)

    return {
        "old_regime"                    : old_regime,
        "new_regime"                    : new_regime,
        "recommended_regime"            : recommended,
        "tax_saving_with_recommendation": tax_saving,
        "missed_deductions"             : missed_deductions,
    }