# CouplesInput (partner A + B), CouplesResponse
"""
Pydantic schemas for Couple's Money Planner feature.
Handles two partner profiles and joint optimization output.
"""
from pydantic import BaseModel, Field
from typing import Optional


class PartnerProfile(BaseModel):
    """
    Financial profile for a single partner.
    All amounts in INR per annum.
    """
    name: str = Field(default="Partner", description="Partner's name or label")

    # Income details
    annual_income: float = Field(..., gt=0, description="Annual gross income")
    tax_bracket: float = Field(..., description="Marginal tax rate as decimal e.g. 0.20 for 20%")

    # HRA details
    basic_salary: float = Field(default=0.0, description="Basic salary per annum")
    hra_received: float = Field(default=0.0, description="HRA received per annum")
    annual_rent_paid: float = Field(default=0.0, description="Annual rent paid")
    is_metro: bool = Field(default=False, description="Living in metro city")

    # Existing investments
    section_80c_invested: float = Field(default=0.0, le=150000, description="Current 80C investments")
    nps_invested: float = Field(default=0.0, le=50000, description="NPS 80CCD(1B) investment")

    # Insurance
    existing_life_cover: float = Field(default=0.0, description="Existing term/life insurance cover")
    existing_health_cover: float = Field(default=0.0, description="Existing health insurance cover")

    # Assets and liabilities
    assets: float = Field(default=0.0, description="Total assets value")
    liabilities: float = Field(default=0.0, description="Total liabilities/loans outstanding")


class CouplesInput(BaseModel):
    """
    Full input schema — both partners together.
    """
    partner_a: PartnerProfile
    partner_b: PartnerProfile


class HRAOptimization(BaseModel):
    """Result of HRA optimization analysis."""
    recommended_claimant: str        # "partner_a" or "partner_b"
    partner_a_exemption: float
    partner_b_exemption: float
    better_exemption: float
    annual_tax_saving: float
    reason: str


class InvestmentRouting(BaseModel):
    """80C investment routing recommendation."""
    higher_bracket_partner: str      # "partner_a" or "partner_b"
    recommended_80c_split: dict      # {"partner_a": amount, "partner_b": amount}
    recommended_nps_split: dict
    total_80c_remaining: float
    total_nps_remaining: float
    annual_tax_saving: float


class InsuranceAnalysis(BaseModel):
    """Insurance adequacy analysis for both partners."""
    partner_a_required_cover: float  # 10x annual income
    partner_b_required_cover: float
    partner_a_gap: float
    partner_b_gap: float
    partner_a_adequate: bool
    partner_b_adequate: bool
    combined_health_adequate: bool   # combined health cover >= 10L recommended


class NetWorthSummary(BaseModel):
    """Combined net worth breakdown."""
    partner_a_net_worth: float
    partner_b_net_worth: float
    combined_net_worth: float
    combined_assets: float
    combined_liabilities: float


class CouplesResponse(BaseModel):
    """
    Full response returned to frontend.
    Frontend renders joint dashboard with optimization cards.
    """
    hra_optimization: HRAOptimization
    investment_routing: InvestmentRouting
    insurance_analysis: InsuranceAnalysis
    net_worth: NetWorthSummary
    combined_annual_income: float
    combined_monthly_income: float
    ai_advice: str