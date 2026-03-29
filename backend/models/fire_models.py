"""
Pydantic schemas for FIRE Path Planner feature.
Handles user profile, multiple goals, and full financial roadmap output.
"""
from pydantic import BaseModel, Field
from typing import List


class Goal(BaseModel):
    """A single financial goal for the FIRE plan."""
    name: str = Field(..., description="Goal name (e.g., 'Retirement', 'Home Purchase')")
    target_amount: float = Field(..., gt=0, description="Target corpus amount in INR")
    years_to_goal: int = Field(..., gt=0, description="Years until goal must be achieved")
    priority: int = Field(..., ge=1, description="Priority rank (1 = highest)")


class FireInput(BaseModel):
    """
    Full input schema for FIRE Path Planner.
    User profile + multiple goals + financial parameters.
    """
    # Personal details
    age: int = Field(..., gt=0, lt=100, description="Current age")
    retirement_age: int = Field(..., gt=0, lt=100, description="Target retirement age")
    user_email: str | None = Field(None, description="Optional email to save the plan to the database")

    # Income and expenses
    annual_income: float = Field(..., gt=0, description="Annual gross income")
    annual_expenses: float = Field(default=0.0, ge=0, description="Annual expenses")
    monthly_expenses: float = Field(default=0.0, ge=0, description="Monthly expenses (optional override)")

    # Existing financial position
    existing_savings: float = Field(default=0.0, ge=0, description="Current savings in INR")
    existing_sip: float = Field(default=0.0, ge=0, description="Current monthly SIP in INR")
    existing_insurance_cover: float = Field(default=0.0, ge=0, description="Existing life insurance cover")

    # Financial assumptions
    expected_cagr: float = Field(default=0.12, ge=0.01, le=0.50, description="Expected annual return (%)")
    inflation_rate: float = Field(default=0.05, ge=0.01, le=0.20, description="Expected inflation rate (%)")

    # Goals
    goals: List[Goal] = Field(..., min_items=1, description="List of financial goals")


class GoalPlan(BaseModel):
    """
    Computed plan for a single financial goal.
    Shows corpus needed, SIP required, and achievability.
    """
    name: str
    target_amount: float
    years_to_goal: int
    inflation_adjusted_corpus: float
    sip_required: float
    current_gap: float
    is_achievable: bool
    priority: int


class AssetAllocation(BaseModel):
    """Asset allocation recommendation based on age."""
    equity_percent: float
    debt_percent: float
    equity_amount_monthly: float
    debt_amount_monthly: float


class FireResponse(BaseModel):
    """
    Full response returned to frontend.
    Contains complete FIRE roadmap with SIP targets, corpus needs, and advice.
    """
    goal_plans: List[GoalPlan]
    total_monthly_sip_required: float
    existing_sip: float
    additional_sip_needed: float
    emergency_fund_target: float
    emergency_fund_gap: float
    insurance_gap: float
    asset_allocation: AssetAllocation
    years_to_retirement: int
    retirement_corpus_needed: float
    monthly_income: float
    monthly_expenses: float
    monthly_surplus: float
    savings_rate_percent: float
    ai_advice: str
    et_context_used: bool = False
