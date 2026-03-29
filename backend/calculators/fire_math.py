"""
FIRE Path Planner calculation engine.
Implements Future Value, reverse PMT (SIP), emergency fund,
insurance gap, and asset allocation calculations.
Pure Python — no AI, no API calls.
"""
from models.fire_models import (
    FireInput,
    Goal,
    GoalPlan,
    AssetAllocation,
    FireResponse,
)


# ─── CONSTANTS ────────────────────────────────────────────────────────────────

EMERGENCY_FUND_MONTHS         = 6     # 6x monthly expenses
INSURANCE_COVER_MULTIPLIER    = 10    # 10x annual income
ACHIEVABILITY_THRESHOLD       = 0.30  # SIP > 30% of monthly income = not achievable
MONTHS_IN_YEAR                = 12


# ─── CORE MATH FUNCTIONS ──────────────────────────────────────────────────────

def calculate_future_value(
    present_value: float,
    rate: float,
    years: int,
) -> float:
    """
    Calculates future value of a lump sum.
    FV = PV × (1 + rate)^years

    Used to:
    - Inflate goal target amounts to future value
    - Project existing savings growth
    """
    return round(present_value * ((1 + rate) ** years), 2)


def calculate_sip_required(
    target_amount: float,
    annual_cagr: float,
    years: int,
) -> float:
    """
    Calculates monthly SIP required to reach a target corpus.
    Reverse PMT formula:
    SIP = FV × r / ((1 + r)^n - 1)

    Where:
        r = monthly rate = annual_cagr / 12
        n = total months = years × 12

    Returns 0 if years is 0 or target is 0.
    """
    if years <= 0 or target_amount <= 0:
        return 0.0

    monthly_rate = annual_cagr / MONTHS_IN_YEAR
    n_months     = years * MONTHS_IN_YEAR

    if monthly_rate == 0:
        return round(target_amount / n_months, 2)

    sip = target_amount * monthly_rate / (((1 + monthly_rate) ** n_months) - 1)
    return round(sip, 2)


def calculate_existing_savings_future_value(
    existing_savings: float,
    annual_cagr: float,
    years: int,
) -> float:
    """
    Projects existing savings to future value.
    Used to offset SIP requirement for each goal.
    """
    return calculate_future_value(existing_savings, annual_cagr, years)


# ─── GOAL PLANNING ────────────────────────────────────────────────────────────

def plan_single_goal(
    goal: Goal,
    data: FireInput,
    monthly_income: float,
    savings_future_value: float,
) -> GoalPlan:
    """
    Computes full plan for a single financial goal.

    Steps:
    1. Inflate target amount to future value (inflation adjusted corpus)
    2. Subtract projected existing savings from target
    3. Calculate SIP required for remaining gap
    4. Check if SIP is achievable (<30% of monthly income)
    """
    # Step 1 — Inflation adjust the target corpus
    inflation_adjusted_corpus = calculate_future_value(
        present_value = goal.target_amount,
        rate          = data.inflation_rate,
        years         = goal.years_to_goal,
    )

    # Step 2 — Project existing savings for this goal's timeline
    projected_savings = calculate_existing_savings_future_value(
        existing_savings = data.existing_savings,
        annual_cagr      = data.expected_cagr,
        years            = goal.years_to_goal,
    )

    # Step 3 — Gap = inflation adjusted corpus - projected savings
    current_gap = max(0.0, inflation_adjusted_corpus - projected_savings)

    # Step 4 — SIP required for the gap
    sip_required = calculate_sip_required(
        target_amount = current_gap,
        annual_cagr   = data.expected_cagr,
        years         = goal.years_to_goal,
    )

    # Step 5 — Achievability check
    is_achievable = sip_required <= (monthly_income * ACHIEVABILITY_THRESHOLD)

    return GoalPlan(
        name                       = goal.name,
        target_amount              = goal.target_amount,
        years_to_goal              = goal.years_to_goal,
        inflation_adjusted_corpus  = inflation_adjusted_corpus,
        sip_required               = sip_required,
        current_gap                = round(current_gap, 2),
        is_achievable              = is_achievable,
        priority                   = goal.priority,
    )


def plan_all_goals(
    data: FireInput,
    monthly_income: float,
) -> list[GoalPlan]:
    """
    Plans all goals sorted by priority then years to goal.
    """
    savings_fv_cache = {}

    def get_savings_fv(years):
        if years not in savings_fv_cache:
            savings_fv_cache[years] = calculate_existing_savings_future_value(
                data.existing_savings,
                data.expected_cagr,
                years,
            )
        return savings_fv_cache[years]

    goal_plans = []
    for goal in data.goals:
        plan = plan_single_goal(
            goal               = goal,
            data               = data,
            monthly_income     = monthly_income,
            savings_future_value = get_savings_fv(goal.years_to_goal),
        )
        goal_plans.append(plan)

    # Sort by priority first, then by years to goal
    return sorted(goal_plans, key=lambda x: (x.priority, x.years_to_goal))


# ─── EMERGENCY FUND ───────────────────────────────────────────────────────────

def calculate_emergency_fund(monthly_expenses: float) -> float:
    """Emergency fund target = 6 × monthly expenses."""
    return round(monthly_expenses * EMERGENCY_FUND_MONTHS, 2)


# ─── INSURANCE GAP ────────────────────────────────────────────────────────────

def calculate_insurance_gap(
    annual_income: float,
    existing_cover: float,
) -> float:
    """
    Insurance gap = 10x annual income - existing cover.
    Returns 0 if existing cover is adequate.
    """
    required = annual_income * INSURANCE_COVER_MULTIPLIER
    return round(max(0.0, required - existing_cover), 2)


# ─── ASSET ALLOCATION ─────────────────────────────────────────────────────────

def calculate_asset_allocation(
    age: int,
    total_monthly_sip: float,
) -> AssetAllocation:
    """
    Asset allocation based on (100 - age)% equity rule.
    Remaining goes to debt instruments.
    """
    equity_pct = min(max((100 - age) / 100, 0.0), 1.0)
    debt_pct   = 1.0 - equity_pct

    return AssetAllocation(
        equity_percent        = round(equity_pct * 100, 1),
        debt_percent          = round(debt_pct * 100, 1),
        equity_amount_monthly = round(total_monthly_sip * equity_pct, 2),
        debt_amount_monthly   = round(total_monthly_sip * debt_pct, 2),
    )


# ─── RETIREMENT CORPUS ────────────────────────────────────────────────────────

def calculate_retirement_corpus(
    annual_expenses: float,
    inflation_rate: float,
    years_to_retirement: int,
) -> float:
    """
    Estimates retirement corpus needed using the 25x rule
    (adjusted for Indian inflation context).
    Inflates current annual expenses to retirement year first,
    then multiplies by 25 for corpus estimate.
    """
    future_annual_expenses = calculate_future_value(
        present_value = annual_expenses,
        rate          = inflation_rate,
        years         = years_to_retirement,
    )
    return round(future_annual_expenses * 25, 2)


# ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

def run_fire_calculation(data: FireInput) -> dict:
    """
    Main function called by the FIRE Planner route.
    Runs all calculations and returns results as a dict.
    """
    # Compute monthly figures
    monthly_income   = round(data.annual_income / MONTHS_IN_YEAR, 2)
    monthly_expenses = (
        data.monthly_expenses
        if data.monthly_expenses > 0
        else round(data.annual_expenses / MONTHS_IN_YEAR, 2)
    )
    monthly_surplus  = round(monthly_income - monthly_expenses, 2)
    savings_rate     = round((monthly_surplus / monthly_income) * 100, 2) if monthly_income > 0 else 0.0

    # Plan all goals
    goal_plans = plan_all_goals(data, monthly_income)

    # Total SIP required across all goals
    total_sip_required   = round(sum(g.sip_required for g in goal_plans), 2)
    additional_sip_needed = round(max(0.0, total_sip_required - data.existing_sip), 2)

    # Emergency fund
    emergency_fund_target = calculate_emergency_fund(monthly_expenses)
    emergency_fund_gap    = round(max(0.0, emergency_fund_target - data.existing_savings), 2)

    # Insurance gap
    insurance_gap = calculate_insurance_gap(
        annual_income  = data.annual_income,
        existing_cover = data.existing_insurance_cover,
    )

    # Asset allocation
    asset_allocation = calculate_asset_allocation(
        age              = data.age,
        total_monthly_sip = total_sip_required,
    )

    # Retirement
    years_to_retirement      = max(0, data.retirement_age - data.age)
    retirement_corpus_needed = calculate_retirement_corpus(
        annual_expenses     = data.annual_expenses,
        inflation_rate      = data.inflation_rate,
        years_to_retirement = years_to_retirement,
    )

    return {
        "goal_plans"                 : goal_plans,
        "total_monthly_sip_required" : total_sip_required,
        "existing_sip"               : data.existing_sip,
        "additional_sip_needed"      : additional_sip_needed,
        "emergency_fund_target"      : emergency_fund_target,
        "emergency_fund_gap"         : emergency_fund_gap,
        "insurance_gap"              : insurance_gap,
        "asset_allocation"           : asset_allocation,
        "years_to_retirement"        : years_to_retirement,
        "retirement_corpus_needed"   : retirement_corpus_needed,
        "monthly_income"             : monthly_income,
        "monthly_expenses"           : monthly_expenses,
        "monthly_surplus"            : monthly_surplus,
        "savings_rate_percent"       : savings_rate,
    }