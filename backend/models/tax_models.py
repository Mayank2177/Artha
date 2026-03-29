# TaxInput (manual or PDF), TaxResponse (both regimes)
"""
Pydantic schemas for Tax Wizard feature.
Handles both manual input and Form 16 PDF upload flows.
"""
from pydantic import BaseModel, Field
from typing import Optional


class ManualTaxInput(BaseModel):
    """
    Schema for manual salary input flow.
    All amounts in Indian Rupees (INR).
    """
    # Basic salary details
    annual_ctc: float = Field(..., gt=0, description="Annual CTC in INR")
    basic_salary: float = Field(..., gt=0, description="Basic salary per annum")
    hra_received: float = Field(default=0.0, description="HRA received per annum")
    da: float = Field(default=0.0, description="Dearness allowance per annum")
    special_allowance: float = Field(default=0.0, description="Special allowance per annum")

    # Location for HRA calculation
    is_metro: bool = Field(default=False, description="True if living in metro city (Delhi, Mumbai, Kolkata, Chennai)")

    # Rent details for HRA exemption
    annual_rent_paid: float = Field(default=0.0, description="Annual rent paid")

    # Old regime deductions
    section_80c: float = Field(default=0.0, le=150000, description="80C investments (max 1.5L)")
    section_80d: float = Field(default=0.0, le=25000, description="Medical insurance premium (max 25K)")
    section_80d_parents: float = Field(default=0.0, le=50000, description="Parents medical insurance (max 50K)")
    section_80ccd_1b: float = Field(default=0.0, le=50000, description="NPS additional contribution (max 50K)")
    home_loan_interest: float = Field(default=0.0, le=200000, description="Home loan interest (max 2L)")
    other_deductions: float = Field(default=0.0, description="Any other deductions")

    # Additional info
    age: int = Field(default=30, ge=18, le=100, description="Age of taxpayer")
    financial_year: str = Field(default="2024-25", description="Financial year")


class TaxBreakdown(BaseModel):
    """Tax calculation result for a single regime."""
    gross_income: float
    total_deductions: float
    taxable_income: float
    tax_before_cess: float
    cess: float
    total_tax: float
    in_hand_monthly: float
    effective_tax_rate: float


class MissedDeduction(BaseModel):
    """A deduction the user hasn't utilized."""
    section: str
    description: str
    max_limit: float
    utilized: float
    remaining: float
    potential_tax_saving: float


class TaxWizardResponse(BaseModel):
    """
    Full response returned to frontend after tax calculation.
    Frontend uses this to render the two regime cards + missed deductions table.
    """
    old_regime: TaxBreakdown
    new_regime: TaxBreakdown
    recommended_regime: str           # "old" or "new"
    tax_saving_with_recommendation: float
    missed_deductions: list[MissedDeduction]
    ai_advice: str                    # Groq generated advice
    et_context_used: bool             # whether ET RSS data was available
    input_source: str                 # "manual" or "pdf"


class PDFExtractedData(BaseModel):
    """
    Structured salary data extracted from Form 16 PDF by LLaMA 8B.
    All fields optional since PDF extraction may miss some fields.
    """
    annual_ctc: Optional[float] = None
    basic_salary: Optional[float] = None
    hra_received: Optional[float] = None
    da: Optional[float] = None
    special_allowance: Optional[float] = None
    section_80c: Optional[float] = None
    section_80d: Optional[float] = None
    section_80ccd_1b: Optional[float] = None
    home_loan_interest: Optional[float] = None
    annual_rent_paid: Optional[float] = None
    is_metro: Optional[bool] = None
    age: Optional[int] = None