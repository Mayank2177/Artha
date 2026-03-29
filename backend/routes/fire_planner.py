"""
FIRE Path Planner route — Feature 02
Accepts user profile and goals, runs full FIRE calculation,
injects ET RSS context, calls Groq for personalized roadmap.
"""
from fastapi import APIRouter, HTTPException

from models.fire_models import FireInput, FireResponse
from calculators.fire_math import run_fire_calculation
from ai.prompts.fire_prompt import build_fire_advice_prompt
from ai.groq_client import groq_manager
from utils.et_feed import get_et_context_block


router = APIRouter()


# ─── ROUTE ────────────────────────────────────────────────────────────────────

@router.post("/fire-planner", response_model=FireResponse)
async def fire_planner(data: FireInput):
    """
    FIRE Path Planner — Full financial roadmap generation.

    Accepts user profile with multiple goals and returns:
    - Inflation adjusted corpus per goal
    - Monthly SIP required per goal
    - Emergency fund target and gap
    - Insurance gap analysis
    - Asset allocation recommendation
    - AI written month by month roadmap grounded in ET market data

    Example request body:
    {
        "age": 28,
        "retirement_age": 50,
        "annual_income": 1200000,
        "annual_expenses": 600000,
        "existing_savings": 500000,
        "existing_sip": 10000,
        "existing_insurance_cover": 5000000,
        "goals": [
            {
                "name": "Retirement",
                "target_amount": 50000000,
                "years_to_goal": 22,
                "priority": 1
            },
            {
                "name": "Home Purchase",
                "target_amount": 8000000,
                "years_to_goal": 7,
                "priority": 2
            },
            {
                "name": "Child Education",
                "target_amount": 3000000,
                "years_to_goal": 15,
                "priority": 3
            }
        ]
    }
    """
    try:
        # COMPUTE — run all FIRE calculations
        result = run_fire_calculation(data)

        # FETCH ET context before Groq call
        et_context = get_et_context_block("fire_planner")

        # ADVISE — build prompt with all computed data + ET context
        prompt = build_fire_advice_prompt(
            data                       = data,
            goal_plans                 = result["goal_plans"],
            total_monthly_sip_required = result["total_monthly_sip_required"],
            existing_sip               = result["existing_sip"],
            additional_sip_needed      = result["additional_sip_needed"],
            emergency_fund_target      = result["emergency_fund_target"],
            emergency_fund_gap         = result["emergency_fund_gap"],
            insurance_gap              = result["insurance_gap"],
            asset_allocation           = result["asset_allocation"],
            years_to_retirement        = result["years_to_retirement"],
            retirement_corpus_needed   = result["retirement_corpus_needed"],
            monthly_income             = result["monthly_income"],
            monthly_expenses           = result["monthly_expenses"],
            monthly_surplus            = result["monthly_surplus"],
            savings_rate_percent       = result["savings_rate_percent"],
            et_context                 = et_context,
        )

        # Call Groq — LLaMA 3.3 70B for roadmap
        ai_advice = groq_manager.chat(
            prompt     = prompt,
            max_tokens = 1500,   # FIRE advice is longer than tax advice
        )

        return FireResponse(
            goal_plans                  = result["goal_plans"],
            total_monthly_sip_required  = result["total_monthly_sip_required"],
            existing_sip                = result["existing_sip"],
            additional_sip_needed       = result["additional_sip_needed"],
            emergency_fund_target       = result["emergency_fund_target"],
            emergency_fund_gap          = result["emergency_fund_gap"],
            insurance_gap               = result["insurance_gap"],
            asset_allocation            = result["asset_allocation"],
            years_to_retirement         = result["years_to_retirement"],
            retirement_corpus_needed    = result["retirement_corpus_needed"],
            monthly_income              = result["monthly_income"],
            monthly_expenses            = result["monthly_expenses"],
            monthly_surplus             = result["monthly_surplus"],
            savings_rate_percent        = result["savings_rate_percent"],
            ai_advice                   = ai_advice,
            et_context_used             = bool(et_context),
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f"FIRE calculation failed: {str(e)}"
        )