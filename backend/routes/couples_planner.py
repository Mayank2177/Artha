"""
Couple's Money Planner route — Feature 05
Accepts both partner profiles, runs joint optimization,
calls Groq for personalized couples advice.
"""
from fastapi import APIRouter, HTTPException

from models.couples_models import CouplesInput, CouplesResponse
from calculators.couples_optimizer import run_couples_optimization
from ai.prompts.couples_prompt import build_couples_advice_prompt
from ai.groq_client import groq_manager


router = APIRouter()


# ─── ROUTE ────────────────────────────────────────────────────────────────────

@router.post("/couples-planner", response_model=CouplesResponse)
async def couples_planner(data: CouplesInput):
    """
    Couple's Money Planner — Joint financial optimization.

    Accepts both partner profiles and returns:
    - HRA optimization (who should claim)
    - 80C + NPS investment routing
    - Insurance adequacy analysis
    - Combined net worth summary
    - AI written joint financial strategy

    Example request body:
    {
        "partner_a": {
            "name": "Rahul",
            "annual_income": 1500000,
            "tax_bracket": 0.30,
            "basic_salary": 750000,
            "hra_received": 300000,
            "annual_rent_paid": 240000,
            "is_metro": true,
            "section_80c_invested": 50000,
            "nps_invested": 0,
            "existing_life_cover": 10000000,
            "existing_health_cover": 500000,
            "assets": 3000000,
            "liabilities": 1000000
        },
        "partner_b": {
            "name": "Priya",
            "annual_income": 900000,
            "tax_bracket": 0.20,
            "basic_salary": 450000,
            "hra_received": 180000,
            "annual_rent_paid": 0,
            "is_metro": true,
            "section_80c_invested": 100000,
            "nps_invested": 25000,
            "existing_life_cover": 5000000,
            "existing_health_cover": 300000,
            "assets": 1500000,
            "liabilities": 200000
        }
    }
    """
    try:
        # COMPUTE — run all optimizations
        result = run_couples_optimization(data)

        # ADVISE — build prompt with all computed data
        prompt = build_couples_advice_prompt(
            data                    = data,
            hra                     = result["hra_optimization"],
            investments             = result["investment_routing"],
            insurance               = result["insurance_analysis"],
            net_worth               = result["net_worth"],
            combined_annual_income  = result["combined_annual_income"],
            combined_monthly_income = result["combined_monthly_income"],
        )

        # Call Groq — LLaMA 3.3 70B for advice
        ai_advice = groq_manager.chat(
            prompt     = prompt,
            max_tokens = 1024,
        )

        return CouplesResponse(
            hra_optimization        = result["hra_optimization"],
            investment_routing      = result["investment_routing"],
            insurance_analysis      = result["insurance_analysis"],
            net_worth               = result["net_worth"],
            combined_annual_income  = result["combined_annual_income"],
            combined_monthly_income = result["combined_monthly_income"],
            ai_advice               = ai_advice,
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f"Couples optimization failed: {str(e)}"
        )