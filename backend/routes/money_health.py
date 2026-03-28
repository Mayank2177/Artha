"""
Money Health Score route — Feature 01
Wires together: health_score → health_prompt → groq_manager
"""
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from models.health_models import (
    QuizInput,
    HealthScoreResponse,
    ActionItem,
)
from calculators.health_score import calculate_health_score
from ai.prompts.health_prompt import build_health_advice_prompt
from ai.groq_client import groq_manager


router = APIRouter()


# ─── ROUTE — MONEY HEALTH SCORE ──────────────────────────────────────────────

@router.post("/money-health", response_model=HealthScoreResponse)
async def money_health_score(data: QuizInput):
    """
    Money Health Score — 12-question financial health quiz.

    Frontend sends 12 quiz answers (A/B/C/D).
    Returns computed scores + AI-generated personalized advice.

    Example request body:
    {
        "answers": [
            {"question_id": 1, "selected_option": "A"},
            {"question_id": 2, "selected_option": "B"},
            ...
            {"question_id": 12, "selected_option": "C"}
        ],
        "user_name": "Rahul"
    }
    """
    try:
        # STEP 1 — COMPUTE: Calculate dimension scores (pure Python math)
        result = calculate_health_score(data)

        dimension_scores = result["dimension_scores"]
        overall_score    = result["overall_score"]
        overall_grade    = result["overall_grade"]
        weakest_3        = result["weakest_3"]

        # STEP 2 — ADVISE: Build prompt for Groq AI
        prompt = build_health_advice_prompt(
            dimension_scores = dimension_scores,
            overall_score    = overall_score,
            overall_grade    = overall_grade,
            weakest_3        = weakest_3,
            user_name        = data.user_name,
        )

        # STEP 3 — Call Groq — LLaMA 3.3 70B for personalized advice
        ai_response = groq_manager.chat(
            prompt     = prompt,
            max_tokens = 1024,
        )

        # STEP 4 — Parse AI response (expecting JSON)
        try:
            ai_data = json.loads(ai_response)
        except json.JSONDecodeError:
            # Try to clean common LLM JSON formatting issues
            cleaned = ai_response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            ai_data = json.loads(cleaned)

        # STEP 5 — Validate and extract AI-generated fields
        ai_assessment = ai_data.get("ai_assessment", "")
        top_3_areas   = ai_data.get("top_3_areas_to_fix", weakest_3)[:3]
        action_plan_raw = ai_data.get("action_plan", [])

        # Parse action items
        action_plan = [
            ActionItem(
                priority = item.get("priority", 3),
                area     = item.get("area", "General"),
                action   = item.get("action", "Review your financial situation"),
            )
            for item in action_plan_raw[:5]  # Max 5 actions
        ]

        # Ensure we have at least 3 actions (fallback if AI returns fewer)
        while len(action_plan) < 3:
            action_plan.append(
                ActionItem(
                    priority = 3,
                    area     = weakest_3[len(action_plan) % 3],
                    action   = f"Review and improve your {weakest_3[len(action_plan) % 3]} strategy",
                )
            )

        # STEP 6 — Build final response
        return HealthScoreResponse(
            overall_score      = overall_score,
            overall_grade      = overall_grade,
            dimension_scores   = dimension_scores,
            ai_assessment      = ai_assessment,
            top_3_areas_to_fix = top_3_areas,
            action_plan        = action_plan,
            total_questions    = 12,
            personalized_for   = data.user_name,
        )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code = 500,
            detail      = f"AI response parsing failed: {str(e)}. "
                          "Please try again."
        )

    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f"Money Health Score calculation failed: {str(e)}"
        )
